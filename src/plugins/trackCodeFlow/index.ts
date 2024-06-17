import { BsDiagnostic, BrsFile, OnGetCodeActionsEvent, Statement, EmptyStatement, FunctionExpression, isForEachStatement, isForStatement, isIfStatement, isWhileStatement, createStackedVisitor, isBrsFile, isStatement, isExpression, WalkMode, isTryCatchStatement, isCatchStatement, CompilerPlugin, AfterScopeValidateEvent, AfterFileValidateEvent, util, isFunctionExpression } from 'brighterscript';
import { PluginContext } from '../../util';
import { createReturnLinter } from './returnTracking';
import { createVarLinter, resetVarContext, runDeferredValidation } from './varTracking';
import { extractFixes } from './trackFixes';
import { addFixesToEvent } from '../../textEdit';
import { BsLintDiagnosticContext } from '../../Linter';
import type { Location } from 'vscode-languageserver-types'; // TODO: Get this from brighterscript

export interface NarrowingInfo {
    text: string;
    location: Location;
    type: 'valid' | 'invalid';
    block: Statement;
}

export interface StatementInfo {
    stat: Statement;
    parent?: Statement;
    locals?: Map<string, VarInfo>;
    branches?: number;
    returns?: boolean;
    narrows?: NarrowingInfo[];
}

export enum VarRestriction {
    Iterator = 1,
    CatchedError = 2
}

export interface VarInfo {
    name: string;
    location: Location;
    isGlobal?: boolean;
    isParam?: boolean;
    isUnsafe: boolean;
    restriction?: VarRestriction;
    parent?: StatementInfo;
    metBranches?: number;
    narrowed?: NarrowingInfo;
    isUsed: boolean;
}

export interface LintState {
    file: BrsFile;
    fun: FunctionExpression;
    parent?: StatementInfo;
    stack: Statement[];
    blocks: WeakMap<Statement, StatementInfo>;
    ifs?: StatementInfo;
    trys?: StatementInfo;
    branch?: StatementInfo;
}

export default class TrackCodeFlow implements CompilerPlugin {

    name: 'trackCodeFlow';

    constructor(private lintContext: PluginContext) {
    }

    onGetCodeActions(event: OnGetCodeActionsEvent) {
        const addFixes = addFixesToEvent(event);
        extractFixes(addFixes, event.diagnostics);
    }

    afterScopeValidate(event: AfterScopeValidateEvent) {
        const { scope } = event;
        const callablesMap = util.getCallableContainersByLowerName(scope.getAllCallables());
        const diagnostics = runDeferredValidation(this.lintContext, scope, scope.getAllFiles(), callablesMap);
        event.program.diagnostics.register(diagnostics as any, {
            ...BsLintDiagnosticContext,
            scope: scope
        });
    }

    afterFileValidate(event: AfterFileValidateEvent) {
        const { file } = event;
        if (!isBrsFile(file) || this.lintContext.ignores(file)) {
            return;
        }
        let diagnostics: BsDiagnostic[] = [];

        resetVarContext(file);

        for (const fun of file.parser.ast.findChildren<FunctionExpression>(isFunctionExpression, { walkMode: WalkMode.visitExpressionsRecursive })) {
            const state: LintState = {
                file: file,
                fun: fun,
                parent: undefined,
                stack: [],
                blocks: new WeakMap(),
                ifs: undefined,
                trys: undefined,
                branch: undefined
            };
            let curr: StatementInfo = {
                stat: new EmptyStatement()
            };
            const returnLinter = createReturnLinter(this.lintContext, file, fun, state, diagnostics);
            const varLinter = createVarLinter(this.lintContext, file, fun, state, diagnostics);

            // 1. close
            // 2. visit -> curr
            // 3. open -> curr becomes parent
            const visitStatement = createStackedVisitor((stat: Statement, stack: Statement[]) => {
                state.stack = stack;
                curr = {
                    stat: stat,
                    parent: stack[stack.length - 1],
                    branches: isBranchedStatement(stat) ? 2 : 1
                };
                returnLinter.visitStatement(curr);
                varLinter.visitStatement(curr);

            }, (opened) => {
                state.blocks.set(opened, curr);
                varLinter.openBlock(curr);

                if (isIfStatement(opened)) {
                    state.ifs = curr;
                } else if (isTryCatchStatement(opened)) {
                    state.trys = curr;
                } else if (!curr.parent || isIfStatement(curr.parent) || isTryCatchStatement(curr.parent) || isCatchStatement(curr.parent)) {
                    state.branch = curr;
                }
                state.parent = curr;
            }, (closed, stack) => {
                const block = state.blocks.get(closed);
                state.parent = state.blocks.get(stack[stack.length - 1]);
                if (isIfStatement(closed)) {
                    const { ifs, branch } = findIfBranch(state);
                    state.ifs = ifs;
                    state.branch = branch;
                } else if (isTryCatchStatement(closed)) {
                    const { trys, branch } = findTryBranch(state);
                    state.trys = trys;
                    state.branch = branch;
                }
                if (block) {
                    returnLinter.closeBlock(block);
                    varLinter.closeBlock(block);
                }
            });

            visitStatement(fun.body, undefined);

            if (fun.body.statements.length > 0) {
                /* eslint-disable no-bitwise */
                fun.body.walk((elem, parent) => {
                    // note: logic to ignore CommentStatement used as expression
                    if (isStatement(elem) && !isExpression(parent)) {
                        visitStatement(elem, parent);
                    } else if (parent) {
                        varLinter.visitExpression(elem, parent, curr);
                    }
                }, { walkMode: WalkMode.visitStatements | WalkMode.visitExpressions });
            } else {
                // ensure empty functions are finalized
                state.blocks.set(fun.body, curr);
                state.stack.push(fun.body);
            }

            // close remaining open blocks
            let remain = state.stack.length;
            while (remain-- > 0) {
                const last = state.stack.pop();
                if (!last) {
                    continue;
                }
                const block = state.blocks.get(last);
                state.parent = remain > 0 ? state.blocks.get(state.stack[remain - 1]) : undefined;
                if (block) {
                    returnLinter.closeBlock(block);
                    varLinter.closeBlock(block);
                }
            }
        }

        if (this.lintContext.fix) {
            diagnostics = extractFixes(this.lintContext.addFixes, diagnostics);
        }
        event.program.diagnostics.register(diagnostics, BsLintDiagnosticContext);
    }
}

// Find parent if and block where code flow is branched
function findIfBranch(state: LintState): { ifs?: StatementInfo; branch?: StatementInfo } {
    const { blocks, parent, stack } = state;
    for (let i = stack.length - 2; i >= 0; i--) {
        if (isIfStatement(stack[i])) {
            return {
                ifs: blocks.get(stack[i]),
                branch: blocks.get(stack[i + 1])
            };
        }
    }
    return {
        ifs: undefined,
        branch: parent
    };
}

// Find parent try and block where code flow is branched
function findTryBranch(state: LintState): { trys?: StatementInfo; branch?: StatementInfo } {
    const { blocks, parent, stack } = state;
    for (let i = stack.length - 2; i >= 0; i--) {
        if (isTryCatchStatement(stack[i])) {
            return {
                trys: blocks.get(stack[i]),
                branch: blocks.get(stack[i + 1])
            };
        }
    }
    return {
        trys: undefined,
        branch: parent
    };
}

// `if` and `for/while` are considered as multi-branch
export function isBranchedStatement(stat: Statement) {
    return isIfStatement(stat) || isForStatement(stat) || isForEachStatement(stat) || isWhileStatement(stat) || isTryCatchStatement(stat);
}
