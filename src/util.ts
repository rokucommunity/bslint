import { parse } from 'jsonc-parser';
import * as minimatch from 'minimatch';
import { BsLintConfig, BsLintRules, RuleSeverity, BsLintSeverity } from './index';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { Program, BscFile, DiagnosticSeverity } from 'brighterscript';
import { applyFixes, ChangeEntry, TextEdit } from './textEdit';
import { addJob } from './Linter';

export function getDefaultRules(): BsLintConfig['rules'] {
    return {
        'assign-all-paths': 'error',
        'unsafe-path-loop': 'error',
        'unsafe-iterators': 'error',
        'unreachable-code': 'info',
        'case-sensitivity': 'warn',
        'unused-variable': 'warn',
        // 'no-stop': 'off',
        'consistent-return': 'error',
        // 'only-function': 'off',
        // 'only-sub': 'off',
        'inline-if-style': 'then',
        'block-if-style': 'no-then',
        'condition-style': 'no-group',
        'named-function-style': 'auto',
        'anon-function-style': 'auto',
        'aa-comma-style': 'no-dangling',
        'type-annotations': 'off',
        'no-print': 'off'
    };
}

export function getDefaultSeverity() {
    return rulesToSeverity(getDefaultRules());
}

export function normalizeConfig(options: BsLintConfig) {
    const baseConfig = {
        rules: getDefaultRules()
    };
    const projectConfig = mergeConfigs(loadConfig(options), { rules: options.rules });
    return mergeConfigs(baseConfig, projectConfig);
}

export function mergeConfigs(a: BsLintConfig, b: BsLintConfig): BsLintConfig {
    return {
        ...a,
        ...b,
        rules: {
            ...(a.rules || {}),
            ...(b.rules || {})
        }
    };
}

function loadConfig(options: BsLintConfig) {
    if (options.lintConfig) {
        const bsconfig = tryLoadConfig(options.lintConfig);
        if (bsconfig) {
            return { ...options, ...bsconfig };
        } else {
            throw new Error(`Configuration file '${options.lintConfig}' not found`);
        }
    }
    if (options.project) {
        const bsconfig = tryLoadConfig(path.join(path.dirname(options.project), 'bslint.json'));
        if (bsconfig) {
            return { ...options, ...bsconfig };
        }
    }
    if (options.rootDir) {
        const bsconfig = tryLoadConfig(path.join(options.rootDir, 'bslint.json'));
        if (bsconfig) {
            return { ...options, ...bsconfig };
        }
    }
    const bsconfig = tryLoadConfig('./bslint.json');
    if (bsconfig) {
        return { ...options, ...bsconfig };
    }
    return options;
}

function tryLoadConfig(filename: string): BsLintConfig | undefined {
    if (!existsSync(filename)) {
        return undefined;
    }

    const bserrors = [];
    const bsconfig = parse(readFileSync(filename).toString(), bserrors);
    if (bserrors.length) {
        throw new Error(`Invalid bslint configuration file '${filename}': ${bserrors}`);
    }
    return bsconfig;
}

export interface PluginContext {
    program: Readonly<Program>;
    severity: Readonly<BsLintRules>;
    todoPattern: Readonly<RegExp>;
    globals: string[];
    ignores: (file: BscFile) => boolean;
    fix: Readonly<boolean>;
    checkUsage: Readonly<boolean>;
    addFixes: (file: BscFile, entry: ChangeEntry) => void;
}

export interface PluginWrapperContext extends PluginContext {
    pendingFixes: Map<string, TextEdit[]>;
    applyFixes: () => Promise<void>;
}

export function createContext(program: Program): PluginWrapperContext {
    const { rules, fix, checkUsage, globals, ignores } = normalizeConfig(program.options);
    const ignorePatterns = (ignores || []).map(pattern => {
        return pattern.startsWith('**/') ? pattern : '**/' + pattern;
    });
    const pendingFixes = new Map<string, TextEdit[]>();
    return {
        program: program,
        severity: rulesToSeverity(rules),
        todoPattern: rules['todo-pattern'] ? new RegExp(rules['todo-pattern']) : /TODO|todo|FIXME/,
        globals,
        ignores: (file: BscFile) => {
            return !file || ignorePatterns.some(pattern => minimatch(file.pathAbsolute, pattern));
        },
        fix,
        checkUsage,
        addFixes: (file: BscFile, entry: ChangeEntry) => {
            if (!pendingFixes.has(file.pathAbsolute)) {
                pendingFixes.set(file.pathAbsolute, entry.changes);
            } else {
                pendingFixes.get(file.pathAbsolute).push(...entry.changes);
            }
        },
        applyFixes: () => addJob(applyFixes(fix, pendingFixes)),
        pendingFixes
    };
}

function rulesToSeverity(rules: BsLintConfig['rules']) {
    return {
        assignAllPath: ruleToSeverity(rules['assign-all-paths']),
        unreachableCode: ruleToSeverity(rules['unreachable-code']),
        unsafePathLoop: ruleToSeverity(rules['unsafe-path-loop']),
        unsafeIterators: ruleToSeverity(rules['unsafe-iterators']),
        caseSensitivity: ruleToSeverity(rules['case-sensitivity']),
        unusedVariable: ruleToSeverity(rules['unused-variable']),
        consistentReturn: ruleToSeverity(rules['consistent-return']),
        inlineIfStyle: rules['inline-if-style'],
        blockIfStyle: rules['block-if-style'],
        conditionStyle: rules['condition-style'],
        namedFunctionStyle: rules['named-function-style'],
        anonFunctionStyle: rules['anon-function-style'],
        aaCommaStyle: rules['aa-comma-style'],
        typeAnnotations: rules['type-annotations'],
        noPrint: ruleToSeverity(rules['no-print']),
        noTodo: ruleToSeverity(rules['no-todo']),
        noStop: ruleToSeverity(rules['no-stop']),
        eolLast: rules['eol-last'],
        colorFormat: rules['color-format']
    };
}

function ruleToSeverity(rule: RuleSeverity): BsLintSeverity {
    switch (rule) {
        case 'error':
            return DiagnosticSeverity.Error;
        case 'warn':
            return DiagnosticSeverity.Warning;
        case 'info':
            return DiagnosticSeverity.Information;
        default:
            return DiagnosticSeverity.Hint;
    }
}
