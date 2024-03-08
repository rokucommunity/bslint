import { BscFile, BsDiagnostic, FunctionExpression, GroupingExpression, IfStatement, isIfStatement, isVoidType, Position, Range, VoidType, WhileStatement } from 'brighterscript';
import { ChangeEntry, comparePos, insertText, replaceText } from '../../textEdit';
import { CodeStyleError } from './diagnosticMessages';
import { platform } from 'process';
import { SymbolTypeFlag } from 'brighterscript/dist/SymbolTableFlag';

export function extractFixes(
    addFixes: (file: BscFile, changes: ChangeEntry) => void,
    diagnostics: BsDiagnostic[]
): BsDiagnostic[] {
    return diagnostics.filter(diagnostic => {
        const fix = getFixes(diagnostic);
        if (fix) {
            addFixes(diagnostic.file, fix);
            return false;
        }
        return true;
    });
}

export function getFixes(diagnostic: BsDiagnostic): ChangeEntry {
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
        default:
            return null;
    }
}

function addAAComma(diagnostic: BsDiagnostic) {
    const { range } = diagnostic;
    return {
        diagnostic,
        changes: [
            insertText(range.end, ',')
        ]
    };
}

function removeAAComma(diagnostic: BsDiagnostic) {
    const { range } = diagnostic;
    return {
        diagnostic,
        changes: [
            replaceText(range, '')
        ]
    };
}

function addConditionGroup(diagnostic: BsDiagnostic) {
    const stat: IfStatement | WhileStatement = diagnostic.data;
    const { start, end } = stat.condition.range;
    return {
        diagnostic,
        changes: [
            insertText(Position.create(start.line, start.character), '('),
            insertText(Position.create(end.line, end.character), ')')
        ]
    };
}

function removeConditionGroup(diagnostic: BsDiagnostic) {
    const stat: (IfStatement | WhileStatement) & { condition: GroupingExpression } = diagnostic.data;
    const { leftParen, rightParen } = stat.condition.tokens;
    const spaceBefore = leftParen.leadingWhitespace?.length > 0 ? '' : ' ';
    let spaceAfter = '';
    if (isIfStatement(stat)) {
        spaceAfter = stat.isInline ? ' ' : '';
        if (stat.tokens.then) {
            spaceAfter = stat.tokens.then.leadingWhitespace?.length > 0 ? '' : ' ';
        }
    }
    return {
        diagnostic,
        changes: [
            replaceText(leftParen.range, spaceBefore),
            replaceText(rightParen.range, spaceAfter)
        ]
    };
}

function addThenToken(diagnostic: BsDiagnostic) {
    const stat: IfStatement = diagnostic.data;
    const { end } = stat.condition.range;
    // const { start } = stat.thenBranch.range; // TODO: use when Block range bug is fixed
    const start = stat.thenBranch.statements[0]?.range.start;
    const space = stat.isInline && comparePos(end, start) === 0 ? ' ' : '';
    return {
        diagnostic,
        changes: [
            insertText(end, ` then${space}`)
        ]
    };
}

function removeThenToken(diagnostic: BsDiagnostic) {
    const stat: IfStatement = diagnostic.data;
    const { then } = stat.tokens;
    const { line, character } = then.range.start;
    const range = Range.create(
        line, character - (then.leadingWhitespace?.length || 0), line, character + then.text.length
    );
    return {
        diagnostic,
        changes: [
            replaceText(range, '')
        ]
    };
}

function replaceFunctionTokens(diagnostic: BsDiagnostic, token: string) {
    const fun: FunctionExpression = diagnostic.data;
    const space = fun.tokens.endFunctionType?.text.indexOf(' ') > 0 ? ' ' : '';
    // sub/function keyword
    const keywordChanges = [
        replaceText(fun.tokens.functionType.range, token),
        replaceText(fun.tokens.endFunctionType?.range, `end${space}${token}`)
    ];
    // remove `as void` in case of `sub`
    const returnType = fun.returnTypeExpression?.getType({ flags: SymbolTypeFlag.typetime }) ?? VoidType.instance;
    const returnChanges = token === 'sub' && fun.returnTypeExpression && isVoidType(returnType) ? [
        replaceText(Range.create(fun.tokens.rightParen.range.end, fun.returnTypeExpression.range.end), '')
    ] : [];
    return {
        diagnostic,
        changes: [
            ...keywordChanges,
            ...returnChanges
        ]
    };
}

function addEolLast(diagnostic: BsDiagnostic): ChangeEntry {
    return {
        diagnostic,
        changes: [
            insertText(
                diagnostic.range.end,
                // In single line files, the `preferredEol` cannot be determined
                // e.g: `sub foo() end sub\EOF`
                diagnostic.data.preferredEol ?? (platform.toString() === 'win32' ? '\r\n' : '\n')
            )
        ]
    };
}

function removeEolLast(diagnostic: BsDiagnostic): ChangeEntry {
    return {
        diagnostic,
        changes: [
            replaceText(diagnostic.range, '')
        ]
    };
}
