import { BsConfig, Program, DiagnosticSeverity, CompilerPlugin, BscFile, isBrsFile, isXmlFile, BsDiagnostic, Scope, CallableContainerMap, OnGetCodeActionsEvent } from 'brighterscript';
import Linter from './Linter';
import CheckUsage from './plugins/checkUsage';
import CodeStyle from './plugins/codeStyle';
import TrackCodeFlow from './plugins/trackCodeFlow';
import { extractFixes as extractStyleFixes } from './plugins/codeStyle/styleFixes';
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
        'unused-parameter'?: RuleSeverity;
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
        'no-assocarray-component-field-type'?: RuleSeverity;
        'no-array-component-field-type'?: RuleSeverity;
        'no-regex-duplicates'?: RuleSeverity;
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
    unusedParameter: BsLintSeverity;
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
    noAssocarrayComponentFieldType: BsLintSeverity;
    noArrayComponentFieldType: BsLintSeverity;
    noRegexDuplicates: BsLintSeverity;
}

export { Linter };

export default function factory(): CompilerPlugin {
    const contextMap = new WeakMap<Program, PluginWrapperContext>();
    const checkUsageMap = new WeakMap<Program, CheckUsage>();
    const trackCodeFlowMap = new WeakMap<Program, TrackCodeFlow>();
    const codeStyleMap = new WeakMap<Program, CodeStyle>();

    return {
        name: 'bslint',
        afterProgramCreate: (program: Program) => {
            const context = createContext(program);
            contextMap.set(program, context);
            trackCodeFlowMap.set(program, new TrackCodeFlow(context));
            codeStyleMap.set(program, new CodeStyle(context));
            if (context.checkUsage) {
                checkUsageMap.set(program, new CheckUsage(context));
            }
        },
        afterFileValidate(file: BscFile) {
            const program = file.program;
            const context = contextMap.get(program);
            if (!context || context.ignores(file)) {
                return;
            }
            const codeStyle = codeStyleMap.get(program);
            const trackCodeFlow = trackCodeFlowMap.get(program);
            if (isXmlFile(file)) {
                // XML: CodeStyle field-type checks + CheckUsage component graph collection
                const xmlDiags: BsDiagnostic[] = codeStyle.validateXMLFile(file).map(d => ({ ...d, file }));
                file.addDiagnostics(xmlDiags);
                checkUsageMap.get(program)?.afterFileValidate(file);
            } else if (isBrsFile(file)) {
                const styleDiags: Omit<BsDiagnostic, 'file'>[] = [];

                // Eol-last and regex (no AST walk needed)
                codeStyle.collectBrsPreWalkDiagnostics(file, styleDiags);
                // Top-level comments — outside function bodies, missed by per-function walk below
                codeStyle.checkTopLevelComments(file, styleDiags);

                // Single combined walk: TrackCodeFlow drives it, CodeStyle visitor runs inside
                const styleVisitor = codeStyle.createBrsVisitor(styleDiags);
                trackCodeFlow.afterFileValidate(file, styleVisitor);

                // Post-walk: function keyword / type annotation checks
                codeStyle.collectBrsFunctionDiagnostics(file, styleDiags);

                // Apply style fixes and add style diagnostics to file
                let bsDiags: BsDiagnostic[] = styleDiags.map(d => ({ ...d, file }));
                if (context.fix) {
                    bsDiags = extractStyleFixes(context.addFixes, bsDiags);
                }
                file.addDiagnostics(bsDiags);
            }
        },
        afterScopeValidate(scope: Scope, files: BscFile[], callables: CallableContainerMap) {
            const program = scope.program;
            trackCodeFlowMap.get(program)?.afterScopeValidate(scope, files, callables);
            checkUsageMap.get(program)?.afterScopeValidate(scope, files, callables);
        },
        onGetCodeActions(event: OnGetCodeActionsEvent) {
            const program = event.program;
            trackCodeFlowMap.get(program)?.onGetCodeActions(event);
            codeStyleMap.get(program)?.onGetCodeActions(event);
        },
        afterProgramValidate: async (program: Program) => {
            const context = contextMap.get(program);
            checkUsageMap.get(program)?.afterProgramValidate(program);
            await context.applyFixes();
        }
    };
}
