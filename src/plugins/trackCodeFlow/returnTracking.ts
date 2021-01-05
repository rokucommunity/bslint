import { BscFile, FunctionExpression, BsDiagnostic, isCommentStatement, DiagnosticTag, isReturnStatement, isIfStatement, TokenKind, util, ReturnStatement } from 'brighterscript';
import { LintState, StatementInfo } from '.';
import { BsLintRules } from '../..';

interface ReturnInfo {
    stat: ReturnStatement;
    hasValue: boolean;
}

enum ReturnLintError {
    UnreachableCode = 2011,
    ReturnValueUnexpected = 2012,
    ReturnValueExpected = 2013,
    UnsafeReturnValue = 2014,
    ReturnValueRequired = 2015,
    ReturnValueMissing = 2016,
    LastReturnValueMissing = 2017
}

export function createReturnLinter(
    severity: BsLintRules,
    file: BscFile,
    fun: FunctionExpression,
    state: LintState,
    diagnostics: BsDiagnostic[]
) {
    const returns: ReturnInfo[] = [];

    function visitStatement(curr: StatementInfo) {
        const { parent } = state;
        if (parent?.returns) {
            if (!isCommentStatement(curr.stat)) {
                diagnostics.push({
                    severity: severity.unreachableCode,
                    code: ReturnLintError.UnreachableCode,
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

    function closeBlock(closed: StatementInfo) {
        const { parent } = state;
        if (!parent) {
            finalize(closed);
        } else if (isIfStatement(closed.stat)) {
            if (closed.branches === 0) {
                parent.returns = true;
                parent.branches--;
            }
        } else if (closed.returns) {
            if (isIfStatement(parent.stat)) {
                parent.branches--;
            }
        }
    }

    function finalize(last: StatementInfo) {
        const { consistentReturn } = severity;
        const kind = fun.functionType?.kind === TokenKind.Sub ? 'Sub' : 'Function';
        const returnedValues = returns.filter((r) => r.hasValue);
        const hasReturnedValue = returnedValues.length > 0;
        // Function range only includes the function signature
        const funRangeStart = (fun.functionType ?? fun.leftParen).range.start;
        const funRangeEnd = (fun.returnTypeToken ?? fun.rightParen).range.end;
        const funRange = util.createRangeFromPositions(funRangeStart, funRangeEnd);

        // Explicit `as void` or `sub` without return type should never return a value
        if (
            fun.returnTypeToken?.kind === TokenKind.Void ||
            (kind === 'Sub' && !fun.returnTypeToken)
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
            !!fun.returnTypeToken ||
            returnedValues.length > 0 ||
            (kind === 'Function' && returns.length > 0);
        const missingValue = requiresReturnValue && returnedValues.length !== returns.length;
        const missingBranches = !last.returns;

        // Function doesn't consistently return,
        // or doesn't return at all but has an explicit type
        if ((requiresReturnValue || hasReturnedValue) && (missingBranches || returns.length === 0)) {
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
