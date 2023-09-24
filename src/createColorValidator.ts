import { BsDiagnostic, Range } from 'brighterscript';
import { messages } from './plugins/codeStyle/diagnosticMessages';
import { BsLintRules, RuleColorFormat, RuleColorCase, RuleColorAlpha, RuleColorAlphaDefaults, RuleColorCertCompliant } from './index';

export function createColorValidator(severity: Readonly<BsLintRules>) {
    const { colorFormat, colorCase, colorAlpha, colorAlphaDefaults, colorCertCompliant } = severity;
    return (text, range, diagnostics) => {
        const len = text.length;
        if (len < 7 || len > 12) {
            // we're only interested in string length is between 7 (#DBDBDB) to 12 ("0xDBDBDBff") chars long
            return;
        }

        const hashHexRegex = /#[0-9A-Fa-f]{6}/g;
        const quotedNumericHexRegex = /0x[0-9A-Fa-f]{6}/g;
        const hashHexMatches = (text.startsWith('#') || text.startsWith('"#')) ? text.match(hashHexRegex) : undefined;
        const quotedNumericHexMatches = (text.startsWith('0x') || text.startsWith('"0x')) ? text.match(quotedNumericHexRegex) : undefined;

        if ((colorFormat === 'never') && (quotedNumericHexMatches || hashHexMatches)) {
            diagnostics.push(messages.expectedColorFormat(range));
            return;
        }
        const hashHexAlphaRegex = /#[0-9A-Fa-f]{8}/g;
        const quotedNumericHexAlphaRegex = /0x[0-9A-Fa-f]{8}/g;

        if (colorFormat === 'hash-hex') {
            if (quotedNumericHexMatches) {
                diagnostics.push(messages.expectedColorFormat(range));
            }
            validateColorCase(hashHexMatches, range, diagnostics, colorCase, colorFormat);
            validateColorAlpha(text.match(hashHexAlphaRegex), hashHexMatches, quotedNumericHexMatches, range, diagnostics, colorAlpha, colorAlphaDefaults);
            validateColorCertCompliance(hashHexMatches, range, diagnostics, colorFormat, colorCertCompliant);

        } else if (colorFormat === 'quoted-numeric-hex') {
            if (hashHexMatches) {
                diagnostics.push(messages.expectedColorFormat(range));
            }
            validateColorCase(quotedNumericHexMatches, range, diagnostics, colorCase, colorFormat);
            validateColorAlpha(text.match(quotedNumericHexAlphaRegex), hashHexMatches, quotedNumericHexMatches, range, diagnostics, colorAlpha, colorAlphaDefaults);
            validateColorCertCompliance(quotedNumericHexMatches, range, diagnostics, colorFormat, colorCertCompliant);
        }
    };
}

function validateColorAlpha(alphaMatches: RegExpMatchArray, hashMatches: RegExpMatchArray, quotedNumericHexMatches: RegExpMatchArray, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[], alpha: RuleColorAlpha, alphaDefaults: RuleColorAlphaDefaults) {
    const validateColorAlpha = (alpha === 'never' || alpha === 'always' || alpha === 'allowed');
    if (validateColorAlpha) {
        // debugger
        if (alpha === 'never' && alphaMatches) {
            diagnostics.push(messages.expectedColorAlpha(range));
        }
        if ((alpha === 'always' && alphaMatches === null) && (hashMatches || quotedNumericHexMatches)) {
            diagnostics.push(messages.expectedColorAlpha(range));
        }
        if ((alphaDefaults === 'never' || alphaDefaults === 'only-hidden') && alphaMatches) {
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
    if (validateColorCase && matches) {
        let colorValue = matches[0];
        const charsToStrip = (colorFormat === 'hash-hex') ? 1 : 2;
        colorValue = colorValue.substring(charsToStrip);
        if (colorCase === 'lower' && colorValue !== colorValue.toLowerCase()) {
            diagnostics.push(messages.expectedColorCase(range));
        }
        if (colorCase === 'upper' && colorValue !== colorValue.toUpperCase()) {
            diagnostics.push(messages.expectedColorCase(range));
        }
    }
}

function validateColorCertCompliance(matches: RegExpMatchArray, range: Range, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorFormat: RuleColorFormat, certCompliant: RuleColorCertCompliant) {
    const validateCertCompliant = certCompliant === 'always';
    if (validateCertCompliant && matches) {
        const BROADCAST_SAFE_BLACK = '161616';
        const BROADCAST_SAFE_WHITE = 'DBDBDB';
        const MAX_BLACK_LUMA = getColorLuma(BROADCAST_SAFE_BLACK);
        const MAX_WHITE_LUMA = getColorLuma(BROADCAST_SAFE_WHITE);
        let colorValue = matches[0];
        const charsToStrip = (colorFormat === 'hash-hex') ? 1 : 2;
        colorValue = colorValue.substring(charsToStrip);
        const colorLuma = getColorLuma(colorValue);
        if (colorLuma > MAX_WHITE_LUMA || colorLuma < MAX_BLACK_LUMA) {
            diagnostics.push(messages.colorCertCompliance(range));
        }
    }
}

function getColorLuma(value: string) {
    const rgb = parseInt(value, 16); // Convert rrggbb to decimal
    const red = (rgb >> 16) & 0xff; // eslint-disable-line no-bitwise
    const green = (rgb >> 8) & 0xff; // eslint-disable-line no-bitwise
    const blue = (rgb >> 0) & 0xff; // eslint-disable-line no-bitwise
    // Per ITU-R BT.709
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue; // eslint-disable-line
}
