import { PluginContext } from './util';
import { BsDiagnostic, Range } from 'brighterscript';
import { messages } from './plugins/codeStyle/diagnosticMessages';
import { RuleColorFormat, RuleColorCase, RuleColorAlpha, RuleColorAlphaDefaults, RuleColorCertCompliant } from './index';

export function createColorValidator(lintContext: PluginContext) {
    const { severity } = lintContext;
    const { colorFormat, colorCase, colorAlpha, colorAlphaDefaults, colorCertCompliant } = severity;
    const hashHexRegex = /#[0-9A-Fa-f]{6}/g;
    const hashHexAlphaRegex = /#[0-9A-Fa-f]{8}/g;
    const quotedNumericHexRegex = /0x[0-9A-Fa-f]{6}/g;
    const quotedNumericHexAlphaRegex = /0x[0-9A-Fa-f]{8}/g;
    return (token, range, diagnostics) => {
        const { text } = token;
        const len = text.length;
        if (len < 7 || len > 9) {
            // We're only interested in strings 6 to 8 chars long
            return;
        }
        const hashHexMatches = text.match(hashHexRegex);
        const quotedNumericHexMatches = text.match(quotedNumericHexRegex);
        if (colorFormat === 'hashHex') {
            if (quotedNumericHexMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(range));
            }
            validateColorCase(hashHexMatches, range, diagnostics, colorCase, colorFormat);
            validateColorAlpha(text.match(hashHexAlphaRegex), hashHexMatches, quotedNumericHexMatches, range, diagnostics, colorAlpha, colorAlphaDefaults);
            validateColorCertCompliance(hashHexMatches, range, diagnostics, colorFormat, colorCertCompliant);

        } else if (colorFormat === 'quotedNumericHex') {
            if (hashHexMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(range));
            }
            validateColorCase(quotedNumericHexMatches, range, diagnostics, colorCase, colorFormat);
            validateColorAlpha(text.match(quotedNumericHexAlphaRegex), hashHexMatches, quotedNumericHexMatches, range, diagnostics, colorAlpha, colorAlphaDefaults);
            validateColorCertCompliance(quotedNumericHexMatches, range, diagnostics, colorFormat, colorCertCompliant);

        } else if (colorFormat === 'never') {
            if (quotedNumericHexMatches !== null || hashHexMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(range));
            }
        }
    };
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
        const charsToStrip = (colorFormat === 'hashHex') ? 1 : 2;
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
        const charsToStrip = (colorFormat === 'hashHex') ? 1 : 2;
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
