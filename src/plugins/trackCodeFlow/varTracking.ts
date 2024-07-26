import { BscFile, FunctionExpression, BsDiagnostic, Range, isForStatement, isForEachStatement, isIfStatement, isAssignmentStatement, isNamespaceStatement, NamespaceStatement, Expression, isVariableExpression, isBinaryExpression, TokenKind, Scope, CallableContainerMap, DiagnosticSeverity, isLiteralInvalid, isWhileStatement, isCatchStatement, isLabelStatement, isGotoStatement, ParseMode, util, isMethodStatement, isTryCatchStatement } from 'brighterscript';
import { LintState, StatementInfo, NarrowingInfo, VarInfo, VarRestriction } from '.';
import { PluginContext } from '../../util';
import { Location } from 'vscode-languageserver-types';

export enum VarLintError {
    UninitializedVar = 'LINT1001',
    UnsafeIteratorVar = 'LINT1002',
    UnsafeInitialization = 'LINT1003',
    CaseMismatch = 'LINT1004',
    UnusedVariable = 'LINT1005'
}

enum ValidationKind {
    Assignment = 'Assignment',
    UninitializedVar = 'UninitializedVar',
    Unsafe = 'Unsafe'
}

interface ValidationInfo {
    kind: ValidationKind;
    name: string;
    local?: VarInfo;
    range: Range;
    namespace?: NamespaceStatement;
}

const deferredValidation: Map<string, ValidationInfo[]> = new Map();

function getDeferred(file: BscFile) {
    return deferredValidation.get(file.srcPath);
}

export function resetVarContext(file: BscFile) {
    deferredValidation.set(file.srcPath, []);
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
    let foundLabelAt = 0;

    const args: Map<string, VarInfo> = new Map();
    args.set('m', { name: 'm', location: Location.create('', Range.create(0, 0, 0, 0)), isParam: true, isUnsafe: false, isUsed: true });
    fun.parameters.forEach((p) => {
        const name = p.tokens.name.text;
        args.set(name.toLowerCase(), { name: name, location: p.tokens.name.location, isParam: true, isUnsafe: false, isUsed: false });
    });

    if (isMethodStatement(fun.functionStatement)) {
        args.set('super', { name: 'super', location: null, isParam: true, isUnsafe: false, isUsed: true });
    }

    function verifyVarCasing(curr: VarInfo, name: { text: string; location: Location }) {
        if (curr && curr.name !== name.text) {
            diagnostics.push({
                severity: severity.caseSensitivity,
                code: VarLintError.CaseMismatch,
                message: `Variable '${name.text}' was previously set with a different casing as '${curr.name}'`,
                range: name.location.range,
                file: file,
                data: {
                    name: curr.name,
                    range: name.location.range
                }
            });
        }
    }

    function setLocal(parent: StatementInfo, name: { text: string; location: Location }, restriction?: VarRestriction): VarInfo {
        if (!name) {
            return;
        }
        const key = name.text.toLowerCase();
        const arg = args.get(key);
        const local = {
            name: name.text,
            location: name.location,
            parent: parent,
            restriction: restriction,
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
            range: name.location.range
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
            setLocal(block, stat.tokens.item, VarRestriction.Iterator);
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
                setLocal(block, narrow).narrowed = narrow;
            } else {
                // opposite narrowing for other branches
                setLocal(block, narrow).narrowed = {
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
            setLocal(state.parent, stat.tokens.name, isForStatement(state.parent.stat) ? VarRestriction.Iterator : undefined);
        } else if (isCatchStatement(stat) && state.parent) {
            setLocal(curr, stat.tokens.exceptionVariable, VarRestriction.CatchedError);
        } else if (isLabelStatement(stat) && !foundLabelAt) {
            foundLabelAt = stat.location.range.start.line;
        } else if (foundLabelAt && isGotoStatement(stat) && state.parent) {
            // To avoid false positives when finding a goto statement,
            // very generously mark as used all unused variables after 1st found label line.
            // This isn't accurate but tracking usage across goto jumps is tricky
            const { stack, blocks } = state;
            const labelLine = foundLabelAt;
            for (let i = state.stack.length - 1; i >= 0; i--) {
                const block = blocks.get(stack[i]);
                block?.locals?.forEach(local => {
                    if (local.location.range?.start.line > labelLine) {
                        local.isUsed = true;
                    }
                });
            }
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
        } else if (isCatchStatement(closed.stat)) {
            locals.forEach(local => {
                // drop error variable
                if (local.restriction === VarRestriction.CatchedError) {
                    locals.delete(local.name.toLowerCase());
                }
            });
        }
        // move locals to parent
        if (!parent.locals) {
            parent.locals = locals;
        } else {
            const isParentBranched = isIfStatement(parent.stat) || isTryCatchStatement(parent.stat);
            const isLoop = isForStatement(closed.stat) || isForEachStatement(closed.stat) || isWhileStatement(closed.stat);
            locals.forEach((local, name) => {
                const parentLocal = parent.locals.get(name);
                // if var is an iterator var, flag as partial
                if (local.restriction) {
                    local.isUnsafe = true;
                }
                // combine attributes / met branches
                if (isParentBranched) {
                    if (parentLocal) {
                        local.isUnsafe = parentLocal.isUnsafe || local.isUnsafe;
                        local.metBranches = (parentLocal.metBranches ?? 0) + 1;
                    }
                } else if (parentLocal && !parentLocal.isUnsafe) {
                    local.isUnsafe = false;
                }
                if (parentLocal?.restriction) {
                    local.restriction = parentLocal.restriction;
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
        if (isVariableExpression(expr) && !util.isInTypeExpression(expr)) {
            const name = expr.tokens.name.text;
            if (name === 'm') {
                return;
            }

            const local = findLocal(name);
            if (!local) {
                deferred.push({
                    kind: ValidationKind.UninitializedVar,
                    name: name,
                    range: expr.location.range,
                    namespace: expr.findAncestor<NamespaceStatement>(isNamespaceStatement)
                });
                return;
            } else {
                local.isUsed = true;
                verifyVarCasing(local, expr.tokens.name);
            }

            if (local.isUnsafe && !findSafeLocal(name)) {
                if (local.restriction) {
                    diagnostics.push({
                        severity: severity.unsafeIterators,
                        code: VarLintError.UnsafeIteratorVar,
                        message: `Using iterator variable '${name}' outside loop`,
                        range: expr.location.range,
                        file: file
                    });
                } else if (!isNarrowing(local, expr, parent, curr)) {
                    diagnostics.push({
                        severity: severity.unsafePathLoop,
                        code: VarLintError.UnsafeInitialization,
                        message: `Not all the code paths assign '${name}'`,
                        range: expr.location.range,
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
        const operator = parent.tokens.operator.kind;
        if (operator !== TokenKind.Equal && operator !== TokenKind.LessGreater) {
            return false;
        }
        const narrow: NarrowingInfo = {
            text: local.name,
            location: local.location,
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
            if (!local.isUsed && !local.restriction) {
                diagnostics.push({
                    severity: severity.unusedVariable,
                    code: VarLintError.UnusedVariable,
                    message: `Variable '${local.name}' is set but value is never used`,
                    range: local.location.range,
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
    const topLevelVars = buildTopLevelVars(scope, lintContext.globals);
    const diagnostics: BsDiagnostic[] = [];
    files.forEach((file) => {
        const deferred = deferredValidation.get(file.srcPath);
        if (deferred) {
            deferredVarLinter(scope, file, callables, topLevelVars, deferred, diagnostics);
        }
    });
    return diagnostics;
}

/**
 * Get a list of all top level variables available in the scope
 */
function buildTopLevelVars(scope: Scope, globals: string[]) {
    // lookups for namespaces, classes, enums, etc...
    // to add them to the topLevel so that they don't get marked as unused.
    const toplevel = new Set<string>(globals);

    for (const namespace of scope.getAllNamespaceStatements()) {
        toplevel.add(getRootNamespaceName(namespace).toLowerCase()); // keep root of namespace
    }
    for (const [, cls] of scope.getClassMap()) {
        toplevel.add(cls.item.tokens.name.text.toLowerCase());
    }
    for (const [, enm] of scope.getEnumMap()) {
        toplevel.add(enm.item.name.toLowerCase());
    }
    for (const [, cnst] of scope.getConstMap()) {
        toplevel.add(cnst.item.name.toLowerCase());
    }
    return toplevel;
}

function deferredVarLinter(
    scope: Scope,
    file: BscFile,
    callables: CallableContainerMap,
    toplevel: Set<string>,
    deferred: ValidationInfo[],
    diagnostics: BsDiagnostic[]
) {
    deferred.forEach(({ kind, name, local, range, namespace }) => {
        const key = name?.toLowerCase();
        let hasCallable = key ? callables.has(key) || toplevel.has(key) : false;
        if (key && !hasCallable && namespace) {
            // check if this could be a callable in the current namespace
            const keyUnderNamespace = `${namespace.getName(ParseMode.BrightScript)}_${key}`.toLowerCase();
            hasCallable = callables.has(keyUnderNamespace);
        }
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
            case ValidationKind.Assignment:
                break;
            case ValidationKind.Unsafe:
                break;
        }
    });
}

/**
 * Get the leftmost part of the namespace name. (i.e. `alpha` from `alpha.beta.charlie`) by walking
 * up the namespace chain until we get to the very topmost namespace. Then grabbing the leftmost token's name.
 *
 */
export function getRootNamespaceName(namespace: NamespaceStatement) {
    // there are more concise ways to accomplish this, but this is a hot function so it's been optimized.
    while (true) {
        const parent = namespace.parent?.parent as NamespaceStatement;
        if (isNamespaceStatement(parent)) {
            namespace = parent;
        } else {
            break;
        }
    }
    const result = util.getDottedGetPath(namespace.nameExpression)[0]?.tokens.name?.text;
    // const name = namespace.getName(ParseMode.BrighterScript).toLowerCase();
    // if (name.includes('imigx')) {
    //     console.log([name, result]);
    // }
    return result;
}
