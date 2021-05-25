import { BscFile, BsDiagnostic, FunctionExpression, GroupingExpression, IfStatement, isIfStatement, Position, Range, WhileStatement } from 'brighterscript';
import { ChangeEntry, comparePos, insertText, replaceText } from '../../textEdit';
import { CodeStyleError } from './diagnosticMessages';

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
        default:
            return null;
    }
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
    const stat: (IfStatement | WhileStatement) & { condition: GroupingExpression} = diagnostic.data;
    const { left, right } = stat.condition.tokens;
    const spaceBefore = left.leadingWhitespace?.length > 0 ? '' : ' ';
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
            replaceText(left.range, spaceBefore),
            replaceText(right.range, spaceAfter)
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
    const space = fun.end?.text.indexOf(' ') > 0 ? ' ' : '';
    return {
        diagnostic,
        changes: [
            replaceText(fun.functionType.range, token),
            replaceText(fun.end?.range, `end${space}${token}`)
        ]
    };
}
