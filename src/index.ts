import { BsConfig, Program, DiagnosticSeverity, CompilerPlugin } from 'brighterscript';
import Linter from './Linter';
import CheckUsage from './plugins/checkUsage';
import CodeStyle from './plugins/codeStyle';
import TrackCodeFlow from './plugins/trackCodeFlow';
import CodePerformance from './plugins/performanceSuggestions';
import { PluginWrapperContext, createContext } from './util';

export type RuleSeverity = 'error' | 'warn' | 'info' | 'off';
export type RuleInlineIf = 'never' | 'no-then' | 'then' | 'off';
export type RuleBlockIf = 'no-then' | 'then' | 'off';
export type RuleCondition = 'no-group' | 'group' | 'off';
export type RuleFunction = 'no-function' | 'no-sub' | 'auto' | 'off';
export type RuleAAComma = 'always' | 'no-dangling' | 'never' | 'off';
export type RuleTypeAnnotations = 'all' | 'return' | 'args' | 'off';
export type RuleEolLast = 'always' | 'never' | 'off';
export type RuleColorFormat = 'hash-hex' | 'quoted-numeric-hex' | 'never' | 'off';
export type RuleColorCase = 'upper' | 'lower' | 'off';
export type RuleColorAlpha = 'always' | 'allowed' | 'never' | 'off';
export type RuleColorAlphaDefaults = 'allowed' | 'only-hidden' | 'never' | 'off';
export type RuleColorCertCompliant = 'always' | 'off'; // Roku cert requirement for broadcast safe colors. 6.4

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
        'no-stop'?: RuleSeverity;
        // 'only-function'?: RuleSeverity,
        // 'only-sub'?: RuleSeverity,
        'inline-if-style'?: RuleInlineIf;
        'block-if-style'?: RuleBlockIf;
        'condition-style'?: RuleCondition;
        'named-function-style'?: RuleFunction;
        'anon-function-style'?: RuleFunction;
        'aa-comma-style'?: RuleAAComma;
        'type-annotations'?: RuleTypeAnnotations;
        'no-print'?: RuleSeverity;
        'no-todo'?: RuleSeverity;
        // Will be transformed to RegExp type when program context is created.
        'todo-pattern'?: string;
        'eol-last'?: RuleEolLast;
        'color-format'?: RuleColorFormat;
        'color-case'?: RuleColorCase;
        'color-alpha'?: RuleColorAlpha;
        'color-alpha-defaults'?: RuleColorAlphaDefaults;
        'color-cert'?: RuleColorCertCompliant;
        'interface-type'?: RuleSeverity;
    };
    globals?: string[];
    ignores?: string[];
    fix?: boolean;
    checkUsage?: boolean;
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
    namedFunctionStyle: RuleFunction;
    anonFunctionStyle: RuleFunction;
    aaCommaStyle: RuleAAComma;
    typeAnnotations: RuleTypeAnnotations;
    noPrint: BsLintSeverity;
    noTodo: BsLintSeverity;
    noStop: BsLintSeverity;
    eolLast: RuleEolLast;
    colorFormat: RuleColorFormat;
    colorCase: RuleColorCase;
    colorAlpha: RuleColorAlpha;
    colorAlphaDefaults: RuleColorAlphaDefaults;
    colorCertCompliant: RuleColorCertCompliant;
    interfaceType: BsLintSeverity;
}

export { Linter };

export default function factory(): CompilerPlugin {
    const contextMap = new WeakMap<Program, PluginWrapperContext>();
    return {
        name: 'bslint',
        afterProgramCreate: (program: Program) => {
            const context = createContext(program);
            contextMap.set(program, context);

            const trackCodeFlow = new TrackCodeFlow(context);
            program.plugins.add(trackCodeFlow);

            const codeStyle = new CodeStyle(context);
            program.plugins.add(codeStyle);

            const codePerformance = new CodePerformance(context);
            program.plugins.add(codePerformance);

            if (context.checkUsage) {
                const checkUsage = new CheckUsage(context);
                program.plugins.add(checkUsage);
            }
        },
        afterProgramValidate: async (program: Program) => {
            const context = contextMap.get(program);
            await context.applyFixes();
        }
    };
}
