import { BsConfig, ProgramBuilder } from 'brighterscript';
import Linter from './Linter';
import * as lintCodeFlow from './plugins/lintCodeFlow';
import { DiagnosticSeverity } from 'brighterscript/dist/parser/ASTUtils';

export type RuleSeverity = 'error' | 'warn' | 'info' | 'off';

export type BsLintConfig = Pick<BsConfig, 'project' | 'rootDir' | 'files' | 'cwd' | 'watch'> & {
    lintConfig?: string;
    rules?: {
        'assign-all-paths'?: RuleSeverity;
        'unsafe-path-loop'?: RuleSeverity;
        'unsafe-iterators'?: RuleSeverity;
        'unreachable-code'?: RuleSeverity;
        // 'case-sensitivity'?: RuleSeverity,
        // 'no-stop'?: RuleSeverity,
        'consistent-return'?: RuleSeverity;
        // 'only-function'?: RuleSeverity,
        // 'only-sub'?: RuleSeverity,
        // 'no-single-line-if'?: RuleSeverity,
        // 'no-optional-then'?: RuleSeverity,
    };
};

export type BsLintSeverity = DiagnosticSeverity;

export interface BsLintRules {
    assignAllPath: BsLintSeverity;
    unsafePathLoop: BsLintSeverity;
    unsafeIterators: BsLintSeverity;
    unreachableCode: BsLintSeverity;
    consistentReturn: BsLintSeverity;
}

export { Linter };

export function initPlugin(builder: ProgramBuilder) {
    lintCodeFlow.initPlugin(builder);
}
