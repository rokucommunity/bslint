import { BscFile, FunctionExpression, BsDiagnostic, Range, isForStatement, isForEachStatement, isIfStatement, isAssignmentStatement, Expression, isVariableExpression, isBinaryExpression, TokenKind, Scope, CallableContainerMap, DiagnosticSeverity, isLiteralInvalid, isWhileStatement, isClassMethodStatement, isBrsFile } from 'brighterscript';
import { LintState, StatementInfo, NarrowingInfo, VarInfo } from '.';
import { PluginContext } from '../../util';

enum VarLintError {
    UninitializedVar = 'LINT1001',
    UnsafeIteratorVar = 'LINT1002',
    UnsafeInitialization = 'LINT1003',
    CaseMismatch = 'LINT1004',
    UnusedVariable = 'LINT1005'
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

const deferredValidation: Map<string, ValidationInfo[]> = new Map();

function getDeferred(file: BscFile) {
    return deferredValidation.get(file.pathAbsolute);
}

export function resetVarContext(file: BscFile) {
    deferredValidation.set(file.pathAbsolute, []);
}

export function createVarLinter(
    lintContext: PluginContext,
    file: BscFile,
    fun: FunctionExpression,
    state: LintState,
    diagnostics: BsDiagnostic[]
) {
    const { severity } = lintContext;
    const deferred = getDeferred(file);

    const args: Map<string, VarInfo> = new Map();
    args.set('m', { name: 'm', range: Range.create(0, 0, 0, 0), isParam: true, isUnsafe: false, isUsed: true });
    fun.parameters.forEach((p) => {
        const name = p.name.text;
        args.set(name.toLowerCase(), { name: name, range: p.name.range, isParam: true, isUnsafe: false, isUsed: false });
    });

    if (isClassMethodStatement(fun.functionStatement)) {
        args.set('super', { name: 'super', range: null, isParam: true, isUnsafe: false, isUsed: true });
    }

    function verifyVarCasing(curr: VarInfo, name: { text: string; range: Range }) {
        if (curr && curr.name !== name.text) {
            diagnostics.push({
                severity: severity.caseSensitivity,
                code: VarLintError.CaseMismatch,
                message: `Variable '${name.text}' was previously set with a different casing as '${curr.name}'`,
                range: name.range,
                file: file
            });
        }
    }

    function setLocal(parent: StatementInfo, name: { text: string; range: Range }, isIterator: boolean): VarInfo {
        const key = name.text.toLowerCase();
        const arg = args.get(key);
        const local = {
            name: name.text,
            range: name.range,
            parent: parent,
            isIterator: isIterator,
            metBranches: 1,
            isUnsafe: false,
            isUsed: false
        };
        if (arg) {
            verifyVarCasing(arg, name);
            return local;
        }

        if (!parent.locals) {
            parent.locals = new Map();
        } else {
            verifyVarCasing(parent.locals.get(key), name);
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

        if (parent?.locals?.has(key)) {
            return parent.locals.get(key);
        }
        for (let i = stack.length - 2; i >= 0; i--) {
            const block = blocks.get(stack[i]);
            const local = block?.locals?.get(key);
            if (local) {
                return local;
            }
        }
        return undefined;
    }

    // A local was found but it is considered unsafe (e.g. set in an if branch)
    // Found out whether a parent has this variable set safely
    function findSafeLocal(name: string): VarInfo | undefined {
        const key = name.toLowerCase();
        const { blocks, stack } = state;
        if (stack.length < 2) {
            return undefined;
        }
        for (let i = stack.length - 2; i >= 0; i--) {
            const block = blocks.get(stack[i]);
            const local = block?.locals?.get(key);
            // if partial, look up higher in the scope for a non-partial
            if (local && !local.isUnsafe) {
                return local;
            }
        }
    }

    function openBlock(block: StatementInfo) {
        const { stat } = block;
        if (isForStatement(stat)) {
            // for iterator will be declared by the next assignement statement
        } else if (isForEachStatement(stat)) {
            // declare `for each` iterator variable
            setLocal(block, stat.item, true);
        } else if (state.parent?.narrows) {
            narrowBlock(block);
        }
    }

    function narrowBlock(block: StatementInfo) {
        const { parent } = state;
        const { stat } = block;

        if (isIfStatement(stat) && isIfStatement(parent.stat)) {
            block.narrows = parent?.narrows;
            return;
        }

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
            if (locals) {
                finalize(locals);
            }
            return;
        }
        // when closing a branched statement, evaluate vars with partial branches covered
        if (branches > 1) {
            locals.forEach((local) => {
                if (local.metBranches !== branches) {
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
            const isLoop = isForStatement(closed.stat) || isForEachStatement(closed.stat) || isWhileStatement(closed.stat);
            locals.forEach((local, name) => {
                const parentLocal = parent.locals.get(name);
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
                if (!local.isUsed && isLoop) {
                    // avoid false positive if a local set in a loop isn't used
                    const someParentLocal = findLocal(local.name);
                    if (someParentLocal?.isUsed) {
                        local.isUsed = true;
                    }
                }
                parent.locals.set(name, local);
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
            if (!local) {
                deferred.push({
                    kind: expr.isCalled ? ValidationKind.UninitialisedFn : ValidationKind.UninitializedVar,
                    name: name,
                    range: expr.range
                });
                return;
            } else {
                local.isUsed = true;
                verifyVarCasing(local, expr.name);
            }

            if (local.isUnsafe && !findSafeLocal(name)) {
                if (local.isIterator) {
                    diagnostics.push({
                        severity: severity.unsafeIterators,
                        code: VarLintError.UnsafeIteratorVar,
                        message: `Using iterator variable '${name}' outside loop`,
                        range: expr.range,
                        file: file
                    });
                } else if (!isNarrowing(local, expr, parent, curr)) {
                    diagnostics.push({
                        severity: severity.unsafePathLoop,
                        code: VarLintError.UnsafeInitialization,
                        message: `Not all the code paths assign '${name}'`,
                        range: expr.range,
                        file: file
                    });
                }
            }
        }
    }

    function isNarrowing(local: VarInfo, expr: Expression, parent: Expression, curr: StatementInfo): boolean {
        // Are we inside an `if/elseif` statement condition?
        if (!isIfStatement(curr.stat)) {
            return false;
        }
        const block = curr.stat.thenBranch;
        // look for a statement testing whether variable is `invalid`,
        // like `if x <> invalid` or `else if x = invalid`
        if (!isBinaryExpression(parent) || !(isLiteralInvalid(parent.left) || isLiteralInvalid(parent.right))) {
            // maybe the variable was narrowed as part of the condition
            // e.g. 2nd condition in: if x <> invalid and x.y = z
            return curr.narrows?.some(narrow => narrow.text === local.name);
        }
        const operator = parent.operator.kind;
        if (operator !== TokenKind.Equal && operator !== TokenKind.LessGreater) {
            return false;
        }
        const narrow: NarrowingInfo = {
            text: local.name,
            range: local.range,
            type: operator === TokenKind.Equal ? 'invalid' : 'valid',
            block
        };
        if (!curr.narrows) {
            curr.narrows = [];
        }
        curr.narrows.push(narrow);
        return true;
    }

    function finalize(locals: Map<string, VarInfo>) {
        locals.forEach(local => {
            if (!local.isUsed && !local.isIterator) {
                diagnostics.push({
                    severity: severity.unusedVariable,
                    code: VarLintError.UnusedVariable,
                    message: `Variable '${local.name}' is set but value is never used`,
                    range: local.range,
                    file: file
                });
            }
        });
    }

    return {
        openBlock: openBlock,
        closeBlock: closeBlock,
        visitStatement: visitStatement,
        visitExpression: visitExpression
    };
}

export function runDeferredValidation(
    lintContext: PluginContext,
    scope: Scope,
    files: BscFile[],
    callables: CallableContainerMap
) {
    const globals = lintContext.globals;

    const diagnostics: BsDiagnostic[] = [];
    files.forEach((file) => {
        const deferred = deferredValidation.get(file.pathAbsolute);
        if (deferred) {
            deferredVarLinter(scope, file, callables, globals, deferred, diagnostics);
        }
    });
    return diagnostics;
}

function deferredVarLinter(
    scope: Scope,
    file: BscFile,
    callables: CallableContainerMap,
    globals: string[],
    deferred: ValidationInfo[],
    diagnostics: BsDiagnostic[]
) {
    // lookups for namespaces and classes
    const toplevel = new Set<string>(globals);
    scope.getAllNamespaceStatements().forEach(ns => {
        toplevel.add(ns.name.toLowerCase().split('.')[0]); // keep root of namespace
    });
    scope.getClassMap().forEach(cls => {
        const name = cls.item.name.text.toLowerCase();
        if (!cls.item.namespaceName) {
            toplevel.add(name);
        }
    });
    if (isBrsFile(file)) {
        file.parser.references.classStatements.forEach(cls => {
            toplevel.add(cls.name.text.toLowerCase());
        });
    }

    deferred.forEach(({ kind, name, local, range }) => {
        const key = name?.toLowerCase();
        const hasCallable = key ? callables.has(key) || toplevel.has(key) : false;
        switch (kind) {
            case ValidationKind.UninitializedVar:
                if (!hasCallable) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        code: VarLintError.UninitializedVar,
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
                        code: VarLintError.UninitializedVar,
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
