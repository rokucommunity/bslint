import { BrsFile, Scope, XmlFile, BsDiagnostic, TokenKind, CallableContainerMap, Program, CompilerPlugin } from 'brighterscript';
import { Statement, ReturnStatement, Expression, FunctionExpression, EmptyStatement } from 'brighterscript/dist/parser';
import {
    DiagnosticSeverity,
    DiagnosticTag,
    isAssignmentStatement,
    isCommentStatement,
    isForEachStatement,
    isForStatement,
    isIfStatement,
    isReturnStatement,
    isVariableExpression,
    isWhileStatement,
    Range,
    createStackedVisitor,
    isBinaryExpression,
    isLiteralInvalid,
    isGroupingExpression,
    isBrsFile,
    isStatement,
    isExpression,
    WalkMode
} from 'brighterscript/dist/astUtils';
import { PluginContext, resolveContext, getDefaultSeverity } from '../util';

interface NarrowingInfo {
    text: string;
    range: Range;
    type: 'valid' | 'invalid';
    branch: number;
    block: Statement;
}

interface StatementInfo {
    stat: Statement;
    parent?: Statement;
    locals?: Map<string, VarInfo>;
    branches?: number;
    returns?: boolean;
    narrows?: NarrowingInfo[];
}

interface VarInfo {
    name: string;
    range: Range;
    isGlobal?: boolean;
    isParam?: boolean;
    isIterator?: boolean;
    isUnsafe: boolean;
    parent?: StatementInfo;
    metBranches?: number;
    narrowed?: NarrowingInfo;
}

interface ReturnInfo {
    stat: ReturnStatement;
    hasValue: boolean;
}

enum ValidationKind {
    Assignment = 'Assignment',
    UninitializedVar = 'UninitializedVar',
    UninitialisedFn = 'UninitialisedFn',
    Unsafe = 'Unsafe'
}

interface ValidationInfo {
    kind: ValidationKind;
    name: string;
    local?: VarInfo;
    range: Range;
}

enum LintError {
    UninitializedVar = 2001,
    UnsafeIteratorVar = 2002,
    UnsafeInitialization = 2003,
    UnreachableCode = 2004,
    ReturnValueUnexpected = 2005,
    ReturnValueExpected = 2006,
    UnsafeReturnValue = 2007,
    ReturnValueRequired = 2008,
    ReturnValueMissing = 2009,
    LastReturnValueMissing = 2010
}

let lintContext: PluginContext = { severity: getDefaultSeverity() };

interface LintState {
    parent?: StatementInfo;
    stack: Statement[];
    blocks: WeakMap<Statement, StatementInfo>;
    ifs?: StatementInfo;
    branch?: StatementInfo;
}

const deferredValidation: Map<string, ValidationInfo[]> = new Map();

const pluginInterface: CompilerPlugin = {
    name: 'trackCodeFlow',
    afterProgramCreate,
    afterScopeValidate,
    afterFileValidate
};
export default pluginInterface;

function afterProgramCreate(program: Program) {
    program.plugins.add(pluginInterface);
    lintContext = resolveContext(program);
}

function afterScopeValidate(scope: Scope, files: (BrsFile | XmlFile)[], callables: CallableContainerMap) {
    const diagnostics: BsDiagnostic[] = [];
    files.forEach((file) => {
        const deferred = deferredValidation.get(file.pathAbsolute);
        if (deferred) {
            deferredVarLinter(scope, file, callables, deferred, diagnostics);
        }
    });
    scope.addDiagnostics(diagnostics);
}

function afterFileValidate(file: (BrsFile | XmlFile)) {
    if (!isBrsFile(file)) {
        return;
    }
    const diagnostics: BsDiagnostic[] = [];
    const deferred: ValidationInfo[] = [];

    file.parser.references.functionExpressions.forEach((fun) => {
        const state: LintState = {
            parent: undefined,
            stack: [],
            blocks: new WeakMap(),
            ifs: undefined,
            branch: undefined
        };
        let curr: StatementInfo = {
            stat: new EmptyStatement()
        };
        const returnLinter = createReturnLinter(file, fun, state, diagnostics, deferred);
        const varLinter = createVarLinter(file, fun, state, diagnostics, deferred);

        // 1. close
        // 2. visit -> curr
        // 3. open -> curr becomes parent
        const visitStatement = createStackedVisitor((stat: Statement, stack: Statement[]) => {
            state.stack = stack;
            curr = { stat: stat, parent: stack[stack.length - 1], branches: 0 };
            returnLinter.visitStatement(curr);
            varLinter.visitStatement(curr);
        }, (opened) => {
            state.blocks.set(opened, curr);
            returnLinter.openBlock(curr);
            varLinter.openBlock(curr);
            if (isIfStatement(opened)) {
                state.ifs = curr;
            } else if (!curr.parent || isIfStatement(curr.parent)) {
                state.branch = curr;
            }
            state.parent = curr;
        }, (closed, stack) => {
            const block = state.blocks.get(closed);
            state.parent = state.blocks.get(stack[stack.length - 1]);
            if (isIfStatement(closed)) {
                const { ifs, branch } = findBranch(state);
                state.ifs = ifs;
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
    });

    deferredValidation.set(file.pathAbsolute, deferred);
    file.addDiagnostics(diagnostics);
}

function findBranch(state: LintState): { ifs?: StatementInfo; branch?: StatementInfo } {
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

function branchesCount({ stat: s }: StatementInfo) {
    if (isIfStatement(s)) {
        return 1 + s.elseIfs.length + 1;
    }
    return 2;
}

// `if` and `for/while` are considered as multi-branch
function isBranchedBlock(block: StatementInfo) {
    return isIfStatement(block.stat) || isForStatement(block.stat) || isForEachStatement(block.stat) || isWhileStatement(block.stat);
}

/** VARIABLES LINTER **/

function createVarLinter(
    file: BrsFile | XmlFile,
    fun: FunctionExpression,
    state: LintState,
    diagnostics: BsDiagnostic[],
    deferred: ValidationInfo[]
) {
    const args: Map<string, VarInfo> = new Map();
    fun.parameters.forEach((p) => {
        const name = p.name.text;
        args.set(name.toLowerCase(), { name: name, range: p.name.range, isParam: true, isUnsafe: false });
    });

    function setLocal(parent: StatementInfo, name: { text: string; range: Range }, isIterator: boolean): VarInfo {
        const key = name.text.toLowerCase();
        const arg = args.get(key);
        const local = {
            name: name.text,
            range: name.range,
            parent: parent,
            isIterator: isIterator,
            metBranches: 1,
            isUnsafe: false
        };
        if (arg) {
            return local;
        }

        if (!parent.locals) {
            parent.locals = new Map();
        }
        parent.locals.set(key, local);

        deferred.push({
            kind: ValidationKind.Assignment,
            name: name.text,
            local: local,
            range: name.range
        });

        return local;
    }

    function findLocal(name: string): VarInfo | undefined {
        const key = name.toLowerCase();
        const arg = args.get(key);
        if (arg) {
            return arg;
        }
        const { parent, blocks, stack } = state;
        let found: VarInfo | undefined;

        if (parent?.locals?.has(key)) {
            found = parent.locals.get(key);
            if (!found?.isUnsafe) {
                return found;
            }
        }

        for (let i = stack.length - 2; i >= 0; i--) {
            const block = blocks.get(stack[i]);
            const local = block?.locals?.get(key);
            if (local) {
                // if partial, look up higher in the scope for a non-partial
                if (!local.isUnsafe) {
                    return local;
                }
                found = local;
            }
        }
        return found;
    }

    function openBlock(block: StatementInfo) {
        const { stat, parent } = block;
        if (isForStatement(stat)) {
            // for iterator will be declared by the next assignement statement
        } else if (isForEachStatement(stat)) {
            // declare `for each` iterator variable
            setLocal(block, stat.item, true);
        } else if (parent && isIfStatement(parent)) {
            if (state.parent?.narrows) {
                narrowBlock(block);
            }
        }
    }

    function narrowBlock(block: StatementInfo) {
        const { parent } = state;
        const { stat } = block;
        parent?.narrows?.forEach(narrow => {
            if (narrow.block === stat) {
                setLocal(block, narrow, false).narrowed = narrow;
            } else {
                // opposite narrowing for other branches
                setLocal(block, narrow, false).narrowed = {
                    ...narrow,
                    type: narrow.type === 'invalid' ? 'valid' : 'invalid'
                };
            }
        });
    }

    function visitStatement(curr: StatementInfo) {
        const { stat } = curr;
        if (isAssignmentStatement(stat) && state.parent) {
            // value = stat.value;
            setLocal(state.parent, stat.name, isForStatement(state.parent.stat));
        }
    }

    function closeBlock(closed: StatementInfo) {
        const { locals, branches, returns } = closed;
        const { parent } = state;
        if (!locals || !parent) {
            return;
        }
        // when closing a branched statement, evaluate vars with partial branches covered
        if (isBranchedBlock(closed)) {
            const numBranches = branches ?? 1;
            locals.forEach((local) => {
                if (local.metBranches !== numBranches) {
                    local.isUnsafe = true;
                }
                local.metBranches = 1;
            });
        } else if (isIfStatement(parent.stat)) {
            locals.forEach(local => {
                // keep narrowed vars if we `return` the invalid branch
                if (local.narrowed) {
                    if (!returns || local.narrowed.type === 'valid') {
                        locals.delete(local.name.toLowerCase());
                    }
                }
            });
        }
        // move locals to parent
        if (!parent.locals) {
            parent.locals = locals;
        } else {
            const isParentIf = isIfStatement(parent.stat);
            locals.forEach((local, name) => {
                const parentLocal = parent.locals?.get(name);
                // if var is an iterator var, flag as partial
                if (local.isIterator) {
                    local.isUnsafe = true;
                }
                // if a parent var isn't partial then the var stays non-partial
                if (isParentIf) {
                    if (parentLocal) {
                        local.isUnsafe = parentLocal.isUnsafe || local.isUnsafe;
                        local.metBranches = (parentLocal.metBranches ?? 0) + 1;
                    }
                } else if (parentLocal && !parentLocal.isUnsafe) {
                    local.isUnsafe = false;
                }
                if (parentLocal?.isIterator) {
                    local.isIterator = parentLocal.isIterator;
                }
                parent.locals?.set(name, local);
            });
        }
    }

    function visitExpression(expr: Expression, parent: Expression, curr: StatementInfo) {
        if (isVariableExpression(expr)) {
            const name = expr.name.text;
            if (name === 'm') {
                return;
            }
            const local = findLocal(name);
            // TODO rule for case sensitive vars?
            if (!local) {
                deferred.push({
                    kind: expr.isCalled ? ValidationKind.UninitialisedFn : ValidationKind.UninitializedVar,
                    name: name,
                    range: expr.range
                });
            } else if (local.isUnsafe) {
                if (local.isIterator) {
                    diagnostics.push({
                        severity: lintContext.severity.unsafeIterators,
                        code: LintError.UnsafeIteratorVar,
                        message: `Using iterator variable '${name}' outside loop`,
                        range: expr.range,
                        file: file
                    });
                } else if (!isNarrowing(local, expr, parent, curr)) {
                    diagnostics.push({
                        severity: lintContext.severity.unsafePathLoop,
                        code: LintError.UnsafeInitialization,
                        message: `Not all the code paths assign '${name}'`,
                        range: expr.range,
                        file: file
                    });
                }
            }
        }
    }

    function isNarrowing(local: VarInfo, expr: Expression, parent: Expression, curr: StatementInfo) {
        // look for a statement testing whether variable is `invalid`,
        // like `if x <> invalid` or `else if x = invalid`
        if (!isIfStatement(curr.stat)) {
            return false;
        }
        if (!isBinaryExpression(parent) || !(isLiteralInvalid(parent.left) || isLiteralInvalid(parent.right))) {
            return false;
        }
        const operator = parent.operator.kind;
        if (operator !== TokenKind.Equal && operator !== TokenKind.LessGreater) {
            return false;
        }
        // find branch where the condition is used
        const ifs = curr.stat;
        let branch = 0;
        let block = ifs.thenBranch;
        if (ifs.elseIfs.length > 0 && !isCondition(ifs.condition, parent)) {
            branch = 1 + ifs.elseIfs.findIndex((b) => isCondition(b.condition, parent));
            if (branch > 0) {
                block = ifs.elseIfs[branch - 1].thenBranch;
            }
        }
        const narrow: NarrowingInfo = {
            text: local.name,
            range: local.range,
            type: operator === TokenKind.Equal ? 'invalid' : 'valid',
            branch,
            block
        };
        if (!curr.narrows) {
            curr.narrows = [];
        }
        curr.narrows.push(narrow);
        return true;
    }

    function isCondition(test, condition) {
        // ignore parenthesis
        if (isGroupingExpression(test)) {
            test = test.expression;
        }
        return test === condition;
    }

    return {
        openBlock: openBlock,
        closeBlock: closeBlock,
        visitStatement: visitStatement,
        visitExpression: visitExpression
    };
}

function deferredVarLinter(
    scope: Scope,
    file: BrsFile | XmlFile,
    callables: CallableContainerMap,
    deferred: ValidationInfo[],
    diagnostics: BsDiagnostic[]
) {
    deferred.forEach(({ kind, name, local, range }) => {
        const key = name?.toLowerCase();
        const hasCallable = key ? !!callables.has(key) : false;
        switch (kind) {
            case ValidationKind.UninitializedVar:
                if (!hasCallable) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        code: LintError.UninitializedVar,
                        message: `Using uninitialised variable '${name}' when this file is included in scope '${scope.name}'`,
                        range: range,
                        file: file
                    });
                }
                // TODO else test case
                break;
            case ValidationKind.UninitialisedFn:
                if (!hasCallable) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        code: LintError.UninitializedVar,
                        message: `Using uninitialised variable '${name}' when this file is included in scope '${scope.name}'`,
                        range: range,
                        file: file
                    });
                }
                // TODO else test case
                break;
            case ValidationKind.Assignment:
                break;
            case ValidationKind.Unsafe:
                break;
        }
    });
}

/** RETURN LINTER **/

function createReturnLinter(
    file: BrsFile | XmlFile,
    fun: FunctionExpression,
    state: LintState,
    diagnostics: BsDiagnostic[],
    deferred: ValidationInfo[]
) {
    const returns: ReturnInfo[] = [];

    function visitStatement(curr: StatementInfo) {
        const { parent } = state;
        if (parent?.returns) {
            if (!isCommentStatement(curr.stat)) {
                diagnostics.push({
                    severity: lintContext.severity.unreachableCode,
                    code: LintError.UnreachableCode,
                    message: 'Unreachable code',
                    range: curr.stat.range,
                    file: file,
                    tags: [DiagnosticTag.Unnecessary]
                });
            }
        } else if (isReturnStatement(curr.stat)) {
            const { ifs, branch, parent } = state;
            returns.push({
                stat: curr.stat,
                hasValue: !!curr.stat.value && !isCommentStatement(curr.stat.value)
            });
            // flag parent branch to return
            const returnBlock = ifs ? branch : parent;
            if (returnBlock && parent?.branches === 1) {
                returnBlock.returns = true;
            }
        }
    }

    function openBlock(block: StatementInfo) {
        if (isBranchedBlock(block)) {
            block.branches = branchesCount(block);
        } else {
            block.branches = 1;
        }
    }

    function closeBlock(closed: StatementInfo) {
        const { parent } = state;
        if (!parent) {
            finalize(closed);
        } else if (isIfStatement(closed.stat)) {
            if (closed.branches === 0) {
                parent.returns = true;
            }
        } else if (closed.returns) {
            if (isIfStatement(parent.stat)) {
                parent.branches = (parent.branches ?? 2) - 1;
            }
        }
    }

    function finalize(last: StatementInfo) {
        const { consistentReturn } = lintContext.severity;
        const returnedValues = returns.filter((r) => r.hasValue);
        const hasReturnedValue = returnedValues.length > 0;

        // Explicit `as void` should never return a value
        if (fun.returnTypeToken?.kind === TokenKind.Void) {
            if (hasReturnedValue) {
                returnedValues.forEach((r) => {
                    diagnostics.push({
                        severity: consistentReturn,
                        code: LintError.ReturnValueUnexpected,
                        message: 'Function as void should not return a value',
                        range: r.stat?.range || fun.range,
                        file: file
                    });
                });
            }
            return;
        }

        const requiresReturnValue =
            !!fun.returnTypeToken ||
            returnedValues.length > 0 ||
            (fun.functionType?.kind === TokenKind.Function && returns.length > 0);
        const missingValue = requiresReturnValue && returnedValues.length !== returns.length;
        const missingBranches = !last.returns;

        // Function doesn't consistently return,
        // or doesn't return at all but has an explicit type
        if ((requiresReturnValue || hasReturnedValue) && (missingBranches || returns.length === 0)) {
            diagnostics.push({
                severity: consistentReturn,
                code: LintError.UnsafeReturnValue,
                message: 'Not all code paths return a value',
                range: fun.range,
                file: file
            });
        }

        // Some return don't have a value
        if (missingValue) {
            returns
                .filter((r) => !r.hasValue)
                .forEach((r) => {
                    diagnostics.push({
                        severity: consistentReturn,
                        code: LintError.ReturnValueMissing,
                        message: 'This function should consistently return a value',
                        range: r.stat.range || fun.range,
                        file: file
                    });
                });
        }
    }

    return {
        openBlock: openBlock,
        closeBlock: closeBlock,
        visitStatement: visitStatement
    };
}
