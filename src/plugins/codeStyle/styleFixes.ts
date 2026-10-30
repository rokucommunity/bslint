import { BscFile, BsDiagnostic, BsDiagnosticInput, FunctionExpression, GroupingExpression, IfStatement, isIfStatement, isVoidType, Locatable, VoidType, WhileStatement, SymbolTypeFlag, util } from 'brighterscript';
import { ChangeEntry, getDiagnosticLocation, insertText, replaceText } from '../../textEdit';
import { CodeStyleError } from './diagnosticMessages';
import { platform } from 'process';

export function extractFixes<T extends BsDiagnostic | BsDiagnosticInput>(
    file: BscFile,
    addFixes: (file: BscFile, changes: ChangeEntry) => void,
    diagnostics: T[]
): T[] {
    return diagnostics.filter(diagnostic => {
        const fix = getFixes(diagnostic);
        if (fix) {
            addFixes(file, fix);
            return false;
        }
        return true;
    });
}

export function getFixes(diagnostic: BsDiagnostic | BsDiagnosticInput): ChangeEntry {
    switch (diagnostic.code) {
        case CodeStyleError.FunctionKeywordExpected:
            return replaceFunctionTokens(diagnostic, 'function');
        case CodeStyleError.SubKeywordExpected:
            return replaceFunctionTokens(diagnostic, 'sub');
        case CodeStyleError.InlineIfThenFound:
        case CodeStyleError.BlockIfThenFound:
            return removeThenToken(diagnostic);
        case CodeStyleError.InlineIfThenMissing:
        case CodeStyleError.BlockIfThenMissing:
            return addThenToken(diagnostic);
        case CodeStyleError.ConditionGroupFound:
            return removeConditionGroup(diagnostic);
        case CodeStyleError.ConditionGroupMissing:
            return addConditionGroup(diagnostic);
        case CodeStyleError.AACommaFound:
            return removeAAComma(diagnostic);
        case CodeStyleError.AACommaMissing:
            return addAAComma(diagnostic);
        case CodeStyleError.EolLastMissing:
            return addEolLast(diagnostic);
        case CodeStyleError.EolLastFound:
            return removeEolLast(diagnostic);
        case CodeStyleError.ForTerminatorEndForExpected:
            return replaceForTerminator(diagnostic, 'end for');
        case CodeStyleError.ForTerminatorNextExpected:
            return replaceForTerminator(diagnostic, 'next');
        default:
            return null;
    }
}

function replaceForTerminator(diagnostic: BsDiagnostic | BsDiagnosticInput, text: string): ChangeEntry {
    return {
        diagnostic,
        changes: [
            replaceText(getDiagnosticLocation(diagnostic.location)?.range, text)
        ]
    };
}

function addAAComma(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const location = getDiagnosticLocation(diagnostic.location);
    return {
        diagnostic,
        changes: [
            insertText(location.range.end, ',')
        ]
    };
}

function removeAAComma(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const location = getDiagnosticLocation(diagnostic.location);
    return {
        diagnostic,
        changes: [
            replaceText(location.range, '')
        ]
    };
}

function addConditionGroup(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const stat: IfStatement | WhileStatement = diagnostic.data;
    const { start, end } = util.getLocation(stat.condition).range;
    return {
        diagnostic,
        changes: [
            insertText(start, '('),
            insertText(end, ')')
        ]
    };
}

function removeConditionGroup(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const stat: (IfStatement | WhileStatement) & { condition: GroupingExpression } = diagnostic.data;
    const { leftParen, rightParen } = stat.condition.tokens;
    const spaceBefore = util.getLeadingWhitespace(leftParen).length > 0 ? '' : ' ';
    let spaceAfter = '';
    if (isIfStatement(stat)) {
        spaceAfter = stat.isInline ? ' ' : '';
        if (stat.tokens.then) {
            spaceAfter = util.getLeadingWhitespace(stat.tokens.then).length > 0 ? '' : ' ';
        }
    }
    return {
        diagnostic,
        changes: [
            replaceText(util.getLocation(leftParen).range, spaceBefore),
            replaceText(util.getLocation(rightParen).range, spaceAfter)
        ]
    };
}

function addThenToken(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const stat: IfStatement = diagnostic.data;
    const firstStatement = stat.thenBranch.statements[0];
    // the condition is directly followed by the first statement (i.e. `if(x)print x`), or there is no statement
    const space = stat.isInline && (!firstStatement || firstStatement.startPosition === stat.condition.endPosition) ? ' ' : '';
    return {
        diagnostic,
        changes: [
            insertText(util.getLocation(stat.condition).range.end, ` then${space}`)
        ]
    };
}

function removeThenToken(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const stat: IfStatement = diagnostic.data;
    const { then } = stat.tokens;
    // remove the `then` keyword along with the whitespace before it
    const thenWithWhitespace: Locatable = {
        startPosition: then.startPosition - util.getLeadingWhitespace(then).length,
        endPosition: then.endPosition,
        sourceInfo: then.sourceInfo
    };
    return {
        diagnostic,
        changes: [
            replaceText(util.getLocation(thenWithWhitespace).range, '')
        ]
    };
}

function replaceFunctionTokens(diagnostic: BsDiagnostic | BsDiagnosticInput, token: string) {
    const fun: FunctionExpression = diagnostic.data;
    const space = fun.tokens.endFunctionType?.text.indexOf(' ') > 0 ? ' ' : '';
    // sub/function keyword
    const keywordChanges = [
        replaceText(util.getLocation(fun.tokens.functionType).range, token),
        replaceText(util.getLocation(fun.tokens.endFunctionType)?.range, `end${space}${token}`)
    ];
    // remove `as void` in case of `sub`
    const returnType = fun.returnTypeExpression?.getType({ flags: SymbolTypeFlag.typetime }) ?? VoidType.instance;
    const returnChanges = token === 'sub' && fun.returnTypeExpression && isVoidType(returnType) ? [
        replaceText(util.getLocation({
            startPosition: fun.tokens.rightParen?.endPosition,
            endPosition: fun.returnTypeExpression?.endPosition,
            sourceInfo: fun.returnTypeExpression?.sourceInfo
        })?.range, '')
    ] : [];
    return {
        diagnostic,
        changes: [
            ...keywordChanges,
            ...returnChanges
        ]
    };
}

function addEolLast(diagnostic: BsDiagnostic | BsDiagnosticInput): ChangeEntry {
    return {
        diagnostic,
        changes: [
            insertText(
                getDiagnosticLocation(diagnostic.location).range.end,
                // In single line files, the `preferredEol` cannot be determined
                // e.g: `sub foo() end sub\EOF`
                diagnostic.data.preferredEol ?? (platform.toString() === 'win32' ? '\r\n' : '\n')
            )
        ]
    };
}

function removeEolLast(diagnostic: BsDiagnostic | BsDiagnosticInput): ChangeEntry {
    return {
        diagnostic,
        changes: [
            replaceText(getDiagnosticLocation(diagnostic.location).range, '')
        ]
    };
}
