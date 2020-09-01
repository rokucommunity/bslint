import { BrsFile, Scope, XmlFile, BsDiagnostic, TokenKind, ProgramBuilder, CallableContainerMap } from 'brighterscript';
import { Statement, ReturnStatement, Expression, FunctionExpression, BlockOf } from 'brighterscript/dist/parser';
import {
    createStatementExpressionsVisitor,
    isAssignmentStatement,
    isIfStatement,
    isReturnStatement,
    isForStatement,
    isForEachStatement,
    isBlock,
    isVariableExpression,
    walkStatements,
    isCommentStatement,
    Range,
    DiagnosticSeverity,
    DiagnosticTag
} from 'brighterscript/dist/parser/ASTUtils';
import { PluginContext, resolveContext, getDefaultSeverity } from '../util';

interface StatementInfo {
    stat: Statement;
    depth: number;
    locals?: Map<string, VarInfo>;
    branches?: number;
    returns?: boolean;
}

interface VarInfo {
    name: string;
    isGlobal?: boolean;
    isParam?: boolean;
    isIterator?: boolean;
    isUnsafe?: boolean;
    parent?: StatementInfo;
    metBranches?: number;
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
    range?: Range;
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
    ReturnValueMissing = 2009
}

let context: PluginContext = { severity: getDefaultSeverity() };

const deferredValidation: Map<string, ValidationInfo[]> = new Map();

export function initPlugin(builder: ProgramBuilder) {
    builder.on('program-created', program => (context = resolveContext(program)));
    builder.on('scope-validate-start', validateScope);
    builder.on('file-validated', validateFile);
}

export function validateScope(scope: Scope, files: (BrsFile | XmlFile)[], callables: CallableContainerMap) {
    const diagnostics: BsDiagnostic[] = [];
    files.forEach((file) => {
        const deferred = deferredValidation.get(file.pathAbsolute);
        if (deferred) {
            deferredVarLinter(scope, file, callables, deferred, diagnostics);
        }
    });
    scope.addDiagnostics(diagnostics);
}

export function validateFile(file: BrsFile) {
    const diagnostics: BsDiagnostic[] = [];
    const deferred: ValidationInfo[] = [];

    file.parser.functionStatements.forEach((fun) => {
        if (fun.name.text.toLowerCase() === 'runuserinterface') {
            file.addDiagnostics([
                {
                    code: 9000,
                    message: 'RunUserInterface is not allowed',
                    range: fun.name.range,
                    file: file
                }
            ]);
        }
    });

    file.parser.functionExpressions.forEach((fun) => {
        const blocks: StatementInfo[] = [];
        const returnLinter = createReturnLinter(file, fun, blocks, diagnostics, deferred);
        const varLinter = createVarLinter(file, fun, blocks, diagnostics, deferred);

        function statementVisitor(stat: Statement, depth: number) {
            const curr = { stat: stat, depth: depth };
            // block closing
            while (blocks.length > 1 && blocks[0].depth >= depth) {
                const block = blocks.shift();
                returnLinter.closeBlock(block);
                varLinter.closeBlock(block);
            }
            // block opening
            if (isIfStatement(stat) || isBlock(stat)) {
                blocks.unshift(curr);
                returnLinter.openBlock(curr);
                varLinter.openBlock(curr);
            } else {
                // statement visit
                returnLinter.visitStatement(curr);
                varLinter.visitStatement(curr);
            }
        }

        function expressionVisitor(expr: Expression) {
            varLinter.visitExpression(expr);
        }

        const visitor = createStatementExpressionsVisitor(statementVisitor, expressionVisitor);
        walkStatements(fun.body, visitor);

        // complete linting for file
        while (blocks.length > 0) {
            const block = blocks.shift();
            returnLinter.closeBlock(block);
            varLinter.closeBlock(block);
        }
    });

    deferredValidation.set(file.pathAbsolute, deferred);
    file.addDiagnostics(diagnostics);
}

function branchesCount({ stat: s }: StatementInfo) {
    if (isIfStatement(s)) {
        return 1 + s.elseIfs.length + 1;
    }
    return 2;
}

// `if` and `for/while` are considered as multi-branch
function isBranchedBlock(block: StatementInfo) {
    if (isIfStatement(block.stat)) {
        return true;
    }
    return (
        isBlock(block.stat) &&
        context.severity.unsafePathLoop !== DiagnosticSeverity.Information &&
        block.stat.of >= BlockOf.ForBody
    );
}

/** VARIABLES LINTER **/

function createVarLinter(
    file: BrsFile | XmlFile,
    fun: FunctionExpression,
    blocks: StatementInfo[],
    diagnostics: BsDiagnostic[],
    deferred: ValidationInfo[]
) {
    const args: Map<string, VarInfo> = new Map();
    fun.parameters.forEach((p) => {
        const name = p.name.text;
        args.set(name.toLowerCase(), { name: name, isParam: true });
    });

    let pendingIterator: string;

    function setLocal(name: string, isIterator: boolean) {
        const key = name.toLowerCase();
        const arg = args.get(key);
        if (arg) {
            return;
        }

        const parent = blocks[0];
        if (!parent.locals) {
            parent.locals = new Map();
        }
        const local = { name: name, parent: parent, isIterator: isIterator, metBranches: 1 };
        parent.locals.set(key, local);

        deferred.push({
            kind: ValidationKind.Assignment,
            name: name,
            local: local
        });
    }

    function findLocal(name: string): VarInfo | undefined {
        const key = name.toLowerCase();
        const arg = args.get(key);
        if (arg) {
            return arg;
        }

        let found: VarInfo;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const local = block.locals?.get(key);
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
        if (pendingIterator) {
            setLocal(pendingIterator, true);
            pendingIterator = undefined;
        }
    }

    function visitStatement(curr: StatementInfo) {
        const { stat } = curr;
        let name: string;
        let isIterator = false;

        if (isAssignmentStatement(stat)) {
            name = stat.name.text;
            // value = stat.value;
        } else if (isForStatement(stat)) {
            name = stat.counterDeclaration.name.text;
            // value = stat.counterDeclaration.value;
            isIterator = true;
        } else if (isForEachStatement(stat)) {
            name = stat.item.text;
            isIterator = true;
        }
        if (name) {
            if (isIterator) {
                pendingIterator = name;
            } else {
                setLocal(name, isIterator);
            }
        }
    }

    function closeBlock(closed: StatementInfo) {
        if (!closed.locals) {
            return;
        }
        const locals = closed.locals;
        const parent = blocks[0];
        if (!parent) {
            return;
        }
        // when closing an if, evaluate vars with partial branches covered
        if (locals && isBranchedBlock(closed)) {
            const numBranches = closed.branches || 1;
            locals.forEach((local) => {
                if (local.metBranches !== numBranches) {
                    local.isUnsafe = true;
                }
                local.metBranches = 1;
            });
        }
        // move locals to parent
        if (!parent.locals) {
            parent.locals = locals;
        } else {
            const isParentIf = isIfStatement(parent.stat);
            locals.forEach((local, name) => {
                const parentLocal = parent.locals.get(name);
                // if var is an iterator var, flag as partial
                if (local.isIterator) {
                    // TODO option to consider iterators as safe
                    local.isUnsafe = true;
                }
                // if a parent var isn't partial then the var stays non-partial
                if (isParentIf) {
                    if (parentLocal) {
                        local.isUnsafe = parentLocal.isUnsafe || local.isUnsafe;
                        local.metBranches = parentLocal.metBranches + 1;
                    }
                } else if (parentLocal && !parentLocal.isUnsafe) {
                    local.isUnsafe = false;
                }
                if (parentLocal?.isIterator) {
                    local.isIterator = parentLocal.isIterator;
                }
                parent.locals.set(name, local);
            });
        }
    }

    function visitExpression(expr: Expression) {
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
                        severity: context.severity.unsafeIterators,
                        code: LintError.UnsafeIteratorVar,
                        message: `Using iterator variable '${name}' outside loop`,
                        range: expr.range,
                        file: file
                    });
                } else {
                    diagnostics.push({
                        severity: context.severity.unsafePathLoop,
                        code: LintError.UnsafeInitialization,
                        message: `Not all the code paths assign '${name}'`,
                        range: expr.range,
                        file: file
                    });
                }
            }
        }
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
        const hasCallable = key ? !!callables[key] : false;
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
    blocks: StatementInfo[],
    diagnostics: BsDiagnostic[],
    deferred: ValidationInfo[]
) {
    const returns: ReturnInfo[] = [];

    function findBranch(): StatementInfo | undefined {
        for (let i = 0; i < blocks.length; i++) {
            if (isIfStatement(blocks[i].stat)) {
                return blocks[i - 1];
            }
        }
        return blocks[blocks.length - 1];
    }

    function visitStatement(curr: StatementInfo) {
        const block = blocks[0];
        if (block.returns) {
            if (!isCommentStatement(curr.stat)) {
                diagnostics.push({
                    severity: context.severity.unreachableCode,
                    code: LintError.UnreachableCode,
                    message: 'Unreachable code',
                    range: curr.stat.range,
                    file: file,
                    tags: [DiagnosticTag.Unnecessary]
                });
            }
        } else if (isReturnStatement(curr.stat)) {
            returns.push({
                stat: curr.stat,
                hasValue: curr.stat.value && !isCommentStatement(curr.stat.value)
            });
            const branch = findBranch();
            if (!branch.returns && block.branches === 1) {
                branch.returns = true;
            }
        }
    }

    function openBlock(block: StatementInfo) {
        const parent = blocks[1];
        if (parent?.returns) {
            diagnostics.push({
                severity: context.severity.unreachableCode,
                code: LintError.UnreachableCode,
                message: 'Unreachable code',
                range: block.stat.range,
                file: file,
                tags: [DiagnosticTag.Unnecessary]
            });
        }
        if (isBranchedBlock(block)) {
            block.branches = branchesCount(block);
        } else {
            block.branches = 1;
        }
    }

    function closeBlock(closed: StatementInfo) {
        const parent = blocks[0];
        if (!parent) {
            finalize(closed);
        } else if (isIfStatement(closed.stat)) {
            if (closed.branches === 0) {
                parent.returns = true;
            }
        } else if (closed.returns) {
            if (isIfStatement(parent.stat)) {
                parent.branches--;
            }
        }
    }

    function finalize(last: StatementInfo) {
        const { consistentReturn } = context.severity;
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

        const requiresReturnValue = !!fun.returnTypeToken;
        const missingValue = returnedValues.length !== returns.length;
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
