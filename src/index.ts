import { BsConfig, Program } from 'brighterscript';
import { DiagnosticSeverity } from 'brighterscript/dist/astUtils';
import Linter from './Linter';
import CodeStyle from './plugins/codeStyle';
import TrackCodeFlow from './plugins/trackCodeFlow';

export type RuleSeverity = 'error' | 'warn' | 'info' | 'off';
export type RuleInlineIf = 'never' | 'no-then' | 'then' | 'off';
export type RuleBlockIf = 'no-then' | 'then' | 'off';
export type RuleCondition = 'no-group' | 'group' | 'off';

export type BsLintConfig = Pick<BsConfig, 'project' | 'rootDir' | 'files' | 'cwd' | 'watch'> & {
    lintConfig?: string;
    rules?: {
        'assign-all-paths'?: RuleSeverity;
        'unsafe-path-loop'?: RuleSeverity;
        'unsafe-iterators'?: RuleSeverity;
        'unreachable-code'?: RuleSeverity;
        'case-sensitivity'?: RuleSeverity;
        'unused-variable'?: RuleSeverity;
        'consistent-return'?: RuleSeverity;
        // 'no-stop'?: RuleSeverity,
        // 'only-function'?: RuleSeverity,
        // 'only-sub'?: RuleSeverity,
        'inline-if-style'?: RuleInlineIf;
        'block-if-style'?: RuleBlockIf;
        'condition-style'?: RuleCondition;
    };
};

export type BsLintSeverity = DiagnosticSeverity;

export interface BsLintRules {
    assignAllPath: BsLintSeverity;
    unsafePathLoop: BsLintSeverity;
    unsafeIterators: BsLintSeverity;
    unreachableCode: BsLintSeverity;
    caseSensitivity: BsLintSeverity;
    unusedVariable: BsLintSeverity;
    consistentReturn: BsLintSeverity;
    inlineIfStyle: RuleInlineIf;
    blockIfStyle: RuleBlockIf;
    conditionStyle: RuleCondition;
}

export { Linter };

export default function factory() {
    return {
        afterProgramCreate: (program: Program) => {
            const trackCodeFlow = new TrackCodeFlow(program);
            program.plugins.add(trackCodeFlow);

            const codeStyle = new CodeStyle(program);
            program.plugins.add(codeStyle);
        }
    };
}
