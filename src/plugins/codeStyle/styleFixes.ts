import { BrsFile, BsDiagnostic, FunctionExpression, GroupingExpression, IfStatement, Range } from 'brighterscript';
import { replaceText } from '../../textEdit';
import { PluginContext } from '../../util';
import { CodeStyleError } from './diagnosticMessages';

export function extractFixes(lintContext: PluginContext, file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[]): (Omit<BsDiagnostic, 'file'>)[] {
    return diagnostics.filter(diagnostic => {
        switch (diagnostic.code) {
            case CodeStyleError.FunctionKeywordExpected:
                lintContext.addFixes(file, replaceFunctionTokens(diagnostic.data, 'function'));
                return false;
            case CodeStyleError.SubKeywordExpected:
                lintContext.addFixes(file, replaceFunctionTokens(diagnostic.data, 'sub'));
                return false;
            case CodeStyleError.InlineIfThenFound:
            case CodeStyleError.BlockIfThenFound:
                lintContext.addFixes(file, removeThenToken(diagnostic.data));
                return false;
            case CodeStyleError.InlineIfThenMissing:
            case CodeStyleError.BlockIfThenMissing:
                lintContext.addFixes(file, addThenToken(diagnostic.data));
                return false;
            case CodeStyleError.ConditionGroupFound:
                lintContext.addFixes(file, removeConditionGroup(diagnostic.data));
                return false;
            case CodeStyleError.ConditionGroupMissing:
                lintContext.addFixes(file, addConditionGroup(diagnostic.data));
                return false;
            default:
                return true;
        }
    });
}

function addConditionGroup(stat: IfStatement) {
    const { start, end } = stat.condition.range;
    return [
        replaceText(Range.create(start.line, start.character, start.line, start.character), '('),
        replaceText(Range.create(end.line, end.character, end.line, end.character), ')')
    ];
}

function removeConditionGroup(stat: IfStatement & { condition: GroupingExpression}) {
    const { left, right } = stat.condition.tokens;
    const spaceBefore = left.leadingWhitespace?.length > 0 ? '' : ' ';
    let spaceAfter = stat.isInline ? ' ' : '';
    if (stat.tokens.then) {
        spaceAfter = stat.tokens.then.leadingWhitespace?.length > 0 ? '' : ' ';
    }
    return [
        replaceText(left.range, spaceBefore),
        replaceText(right.range, spaceAfter)
    ];
}

function addThenToken(stat: IfStatement) {
    const { line, character } = stat.condition.range.end;
    const range = Range.create(
        line, character, line, character
    );
    const space = stat.isInline ? ' ' : '';
    return [
        replaceText(range, ` then${space}`)
    ];
}

function removeThenToken(stat: IfStatement) {
    const { then } = stat.tokens;
    const { line, character } = then.range.start;
    const range = Range.create(
        line, character - (then.leadingWhitespace?.length || 0), line, character + then.text.length
    );
    return [
        replaceText(range, '')
    ];
}

function replaceFunctionTokens(fun: FunctionExpression, token: string) {
    const space = fun.end?.text.indexOf(' ') > 0 ? ' ' : '';
    return [
        replaceText(fun.functionType.range, token),
        replaceText(fun.end?.range, `end${space}${token}`)
    ];
}
