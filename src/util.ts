import { parse } from 'jsonc-parser';
import * as minimatch from 'minimatch';
import { BsLintConfig, BsLintRules, RuleSeverity, BsLintSeverity, RuleColorFormat, RuleColorCase, RuleColorAlpha, RuleColorAlphaDefaults, RuleColorCertCompliant } from './index';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { Program, BscFile, DiagnosticSeverity, BsDiagnostic, Range } from 'brighterscript';
import { applyFixes, ChangeEntry, TextEdit } from './textEdit';
import { addJob } from './Linter';
import { messages } from './plugins/codeStyle/diagnosticMessages';

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

export function validateColorStyle(text: string, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
    const colorHashRegex = /#[0-9A-Fa-f]{6}/g;
    const colorHashAlphaRegex = /#[0-9A-Fa-f]{8}/g;
    const colorZeroXRegex = /0x[0-9A-Fa-f]{6}/g;
    const colorZeroXAlphaRegex = /0x[0-9A-Fa-f]{8}/g;
    const colorHashMatches = text.match(colorHashRegex);
    const colorHashAlphaMatches = text.match(colorHashAlphaRegex);
    const colorZeroXMatches = text.match(colorZeroXRegex);
    const colorZeroXAlphaMatches = text.match(colorZeroXAlphaRegex);

    if (colorFormat === 'hash') {
        if (colorZeroXMatches !== null) {
            diagnostics.push(messages.expectedColorFormat(range));
        }
        validateColorCase(colorHashMatches, range, diagnostics, colorCase, colorFormat);
        validateColorAlpha(colorHashAlphaMatches, colorHashMatches, colorZeroXMatches, range, diagnostics, alpha, alphaDefaults);
        validateColorCertCompliance(colorHashMatches, range, diagnostics, colorFormat, certCompliant);

    } else if (colorFormat === 'zero-x') {
        if (colorHashMatches !== null) {
            diagnostics.push(messages.expectedColorFormat(range));
        }
        validateColorCase(colorZeroXMatches, range, diagnostics, colorCase, colorFormat);
        validateColorAlpha(colorZeroXAlphaMatches, colorHashMatches, colorZeroXMatches, range, diagnostics, alpha, alphaDefaults);
        validateColorCertCompliance(colorZeroXMatches, range, diagnostics, colorFormat, certCompliant);

    } else if (colorFormat === 'never') {
        if (colorZeroXMatches !== null || colorHashMatches !== null) {
            diagnostics.push(messages.expectedColorFormat(range));
        }
    }
}

function validateColorAlpha(alphaMatches: RegExpMatchArray, hashMatches: RegExpMatchArray, zeroXMatches: RegExpMatchArray, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[], alpha: RuleColorAlpha, alphaDefaults: RuleColorAlphaDefaults) {
    const validateColorAlpha = (alpha === 'never' || alpha === 'always' || alpha === 'allowed');
    if (validateColorAlpha) {
        if (alpha === 'never' && alphaMatches !== null) {
            diagnostics.push(messages.expectedColorAlpha(range));
        }
        if ((alpha === 'always' && alphaMatches === null) && (hashMatches !== null || zeroXMatches !== null)) {
            diagnostics.push(messages.expectedColorAlpha(range));
        }
        if ((alphaDefaults === 'never' || alphaDefaults === 'only-hidden') && alphaMatches !== null) {
            for (let i = 0; i < alphaMatches.length; i++) {
                const colorHashAlpha = alphaMatches[i];
                const alphaValue = colorHashAlpha.slice(-2).toLowerCase();
                if (alphaValue === 'ff' || (alphaDefaults === 'never' && alphaValue === '00')) {
                    diagnostics.push(messages.expectedColorAlphaDefaults(range));
                }
            }
        }
    }
}

function validateColorCase(matches: RegExpMatchArray, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorCase: RuleColorCase, colorFormat: RuleColorFormat) {
    const validateColorCase = colorCase === 'upper' || colorCase === 'lower';
    if (validateColorCase && matches !== null) {
        let colorValue = matches[0];
        const charsToStrip = (colorFormat === 'hash') ? 1 : 2;
        colorValue = colorValue.substring(charsToStrip);
        for (let i = 0; i < colorValue.length; i++) {
            const char = colorValue.charAt(i);
            if (colorCase === 'lower' && char === char.toUpperCase() && char !== char.toLowerCase()) {
                diagnostics.push(messages.expectedColorCase(range));
                break;
            }
            if (colorCase === 'upper' && char === char.toLowerCase() && char !== char.toUpperCase()) {
                diagnostics.push(messages.expectedColorCase(range));
                break;
            }
        }
    }
}

function validateColorCertCompliance(matches: RegExpMatchArray, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorFormat: RuleColorFormat, certCompliant: RuleColorCertCompliant) {
    const validateCertCompliant = certCompliant === 'always';
    if (validateCertCompliant && matches !== null) {
        const BROADCAST_SAFE_BLACK = '161616';
        const BROADCAST_SAFE_WHITE = 'DBDBDB';
        const MAX_BLACK_LUMA = getColorLuma(BROADCAST_SAFE_BLACK);
        const MAX_WHITE_LUMA = getColorLuma(BROADCAST_SAFE_WHITE);
        let colorValue = matches[0];
        const charsToStrip = (colorFormat === 'hash') ? 1 : 2;
        colorValue = colorValue.substring(charsToStrip);
        const colorLuma = getColorLuma(colorValue);
        if (colorLuma > MAX_WHITE_LUMA || colorLuma < MAX_BLACK_LUMA) {
            diagnostics.push(messages.colorCertCompliance(range));
        }
    }
}

function getColorLuma(value: string) {
    const rgb = parseInt(value, 16); // Convert rrggbb to decimal
    const red = (rgb >> 16) & 0xff;
    const green = (rgb >> 8) & 0xff;
    const blue = (rgb >> 0) & 0xff;
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue; // Per ITU-R BT.709
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
        colorFormat: rules['color-format'],
        colorCase: rules['color-case'],
        colorAlpha: rules['color-alpha'],
        colorAlphaDefaults: rules['color-alpha-defaults'],
        colorCertCompliant: rules['color-cert']
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
