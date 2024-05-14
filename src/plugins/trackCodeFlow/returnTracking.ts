import { BscFile, FunctionExpression, BsDiagnostic, DiagnosticTag, isReturnStatement, isIfStatement, isThrowStatement, TokenKind, util, ReturnStatement, ThrowStatement, isTryCatchStatement, isCatchStatement, isVoidType } from 'brighterscript';
import { LintState, StatementInfo } from '.';
import { PluginContext } from '../../util';
import { SymbolTypeFlag } from 'brighterscript/dist/SymbolTypeFlag';

interface ReturnInfo {
    stat: ReturnStatement;
    hasValue: boolean;
}

interface ThrowInfo {
    stat: ThrowStatement;
}

enum ReturnLintError {
    UnreachableCode = 'LINT2001',
    ReturnValueUnexpected = 'LINT2002',
    ReturnValueExpected = 'LINT2003',
    UnsafeReturnValue = 'LINT2004',
    ReturnValueRequired = 'LINT2005',
    ReturnValueMissing = 'LINT2006',
    LastReturnValueMissing = 'LINT2007'
}

export function createReturnLinter(
    lintContext: PluginContext,
    file: BscFile,
    fun: FunctionExpression,
    state: LintState,
    diagnostics: BsDiagnostic[]
) {
    const { severity } = lintContext;
    const returns: ReturnInfo[] = [];
    const throws: ThrowInfo[] = [];

    function visitStatement(curr: StatementInfo) {
        const { parent } = state;
        if (parent?.returns) {
            diagnostics.push({
                severity: severity.unreachableCode,
                code: ReturnLintError.UnreachableCode,
                message: 'Unreachable code',
                range: curr.stat.range,
                file: file,
                tags: [DiagnosticTag.Unnecessary]
            });
        } else if (isReturnStatement(curr.stat)) {
            const { ifs, trys, branch, parent } = state;
            returns.push({
                stat: curr.stat,
                hasValue: !!curr.stat.value
            });
            // flag parent branch to return
            const returnBlock = (ifs || trys) ? branch : parent;
            if (returnBlock && parent?.branches === 1) {
                returnBlock.returns = true;
            }
        } else if (isThrowStatement(curr.stat)) {
            const { ifs, trys, branch, parent } = state;
            throws.push({ stat: curr.stat });
            // flag parent branch to 'return'
            const returnBlock = (ifs || trys) ? branch : parent;
            if (returnBlock && parent?.branches === 1) {
                returnBlock.returns = true;
            }
        }
    }

    function closeBlock(closed: StatementInfo) {
        const { parent } = state;
        if (!parent) {
            finalize(closed);
        } else if (isIfStatement(closed.stat) || isTryCatchStatement(closed.stat) || isCatchStatement(closed.stat)) {
            if (closed.branches === 0) {
                parent.returns = true;
                parent.branches--;
            }
        } else if (closed.returns) {
            if (isIfStatement(parent.stat)) {
                parent.branches--;
            } else if (isTryCatchStatement(parent.stat)) {
                parent.branches--;
            } else if (isCatchStatement(parent.stat)) {
                parent.branches--;
            }
        }
    }

    function finalize(last: StatementInfo) {
        const { consistentReturn } = severity;
        const kind = fun.tokens.functionType?.kind === TokenKind.Sub ? 'Sub' : 'Function';
        const returnedValues = returns.filter((r) => r.hasValue);
        const hasReturnedValue = returnedValues.length > 0;
        // Function range only includes the function signature
        const funRangeStart = (fun.tokens.functionType ?? fun.tokens.leftParen).range.start;
        const funRangeEnd = (fun.returnTypeExpression ?? fun.tokens.rightParen).range.end;
        const funRange = util.createRangeFromPositions(funRangeStart, funRangeEnd);

        // Explicit `as void` or `sub` without return type should never return a value
        const returnType = fun.returnTypeExpression?.getType({ flags: SymbolTypeFlag.typetime });

        if (
            isVoidType(returnType) ||
            (kind === 'Sub' && !fun.returnTypeExpression)
        ) {
            if (hasReturnedValue) {
                returnedValues.forEach((r) => {
                    diagnostics.push({
                        severity: consistentReturn,
                        code: ReturnLintError.ReturnValueUnexpected,
                        message: `${kind} as void should not return a value`,
                        range: r.stat?.range || funRange,
                        file: file
                    });
                });
            }
            return;
        }

        const requiresReturnValue =
            !!fun.returnTypeExpression ||
            returnedValues.length > 0 ||
            (kind === 'Function' && returns.length > 0);
        const missingValue = requiresReturnValue && returnedValues.length !== returns.length;
        const missingBranches = !last.returns;

        // Function doesn't consistently return,
        // or doesn't return at all but has an explicit type
        if ((requiresReturnValue || hasReturnedValue) && (missingBranches || (returns.length + throws.length) === 0)) {
            diagnostics.push({
                severity: consistentReturn,
                code: ReturnLintError.UnsafeReturnValue,
                message: 'Not all code paths return a value',
                range: funRange,
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
                        code: ReturnLintError.ReturnValueMissing,
                        message: `${kind} should consistently return a value`,
                        range: r.stat.range || funRange,
                        file: file
                    });
                });
        }
    }

    return {
        closeBlock: closeBlock,
        visitStatement: visitStatement
    };
}
