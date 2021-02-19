import { BscFile, BsDiagnostic, createVisitor, DiagnosticSeverity, isBrsFile, isGroupingExpression, Program, WalkMode } from 'brighterscript';
import { PluginContext, resolveContext } from '../../util';

enum CodeStyleError {
    InlineIfFound = 'LINT3001',
    InlineIfThenMissing = 'LINT3002',
    InlineIfThenFound = 'LINT3003',
    BlockIfThenMissing = 'LINT3004',
    BlockIfThenFound = 'LINT3005',
    ConditionGroupMissing = 'LINT3006',
    ConditionGroupFound = 'LINT3007',
}

export default class CodeStyle {

    name: 'codeStyle';

    lintContext: PluginContext;

    constructor(program: Program) {
        this.lintContext = resolveContext(program);
    }

    afterFileValidate(file: BscFile) {
        if (!isBrsFile(file)) {
            return;
        }

        const diagnostics: BsDiagnostic[] = [];
        const { inlineIfStyle, blockIfStyle, conditionStyle } = this.lintContext.severity;
        const validateInlineIf = inlineIfStyle !== 'off';
        const disallowInlineIf = inlineIfStyle === 'never';
        const requireInlineIfThen = inlineIfStyle === 'then';
        const validateBlockIf = blockIfStyle !== 'off';
        const requireBlockIfThen = blockIfStyle === 'then';
        const validateCondition = conditionStyle !== 'off';
        const requireConditionGroup = conditionStyle === 'group';

        file.ast.walk(createVisitor({
            IfStatement: e => {
                const hasThenToken = !!e.tokens.then;
                if (!e.isInline && validateBlockIf) {
                    if (hasThenToken !== requireBlockIfThen) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Error,
                            code: requireBlockIfThen ? CodeStyleError.BlockIfThenMissing : CodeStyleError.BlockIfThenFound,
                            message: requireBlockIfThen ? `add 'then' keyword` : `remove 'then' keyword`,
                            range: e.tokens.then?.range ?? e.tokens.if.range,
                            file: file
                        });
                    }
                } else if (e.isInline && validateInlineIf) {
                    if (disallowInlineIf) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Error,
                            code: CodeStyleError.InlineIfFound,
                            message: 'no inline if statement allowed',
                            range: e.range,
                            file: file
                        });
                    } else if (hasThenToken !== requireInlineIfThen) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Error,
                            code: requireInlineIfThen ? CodeStyleError.InlineIfThenMissing : CodeStyleError.InlineIfThenFound,
                            message: requireInlineIfThen ? `add 'then' keyword` : `remove 'then' keyword`,
                            range: e.tokens.then?.range ?? e.tokens.if.range,
                            file: file
                        });
                    }
                }

                if (validateCondition) {
                    if (isGroupingExpression(e.condition) !== requireConditionGroup) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Error,
                            code: requireConditionGroup ? CodeStyleError.ConditionGroupMissing : CodeStyleError.ConditionGroupFound,
                            message: requireConditionGroup ? 'add parenthesis around condition' : 'remove parenthesis around condition',
                            range: e.condition.range,
                            file: file
                        });
                    }
                }
            }
        }), { walkMode: WalkMode.visitStatementsRecursive });

        diagnostics.forEach(diagnostic => (diagnostic.message = `Code style: ${diagnostic.message}`));
        file.addDiagnostics(diagnostics);
    }
}
