import { RuleColorFormat, RuleColorCase, RuleColorAlpha, RuleColorAlphaDefaults, RuleColorCertCompliant } from './index';

export function createColorValidator(colorFormat: RuleColorFormat, colorCase: RuleColorCase, alpha: RuleColorAlpha, alphaDefaults: RuleColorAlphaDefaults, certCompliant: RuleColorCertCompliant) {
    const colorHashRegex = /#[0-9A-Fa-f]{6}/g;
    const colorHashAlphaRegex = /#[0-9A-Fa-f]{8}/g;
    const colorZeroXRegex = /0x[0-9A-Fa-f]{6}/g;
    const colorZeroXAlphaRegex = /0x[0-9A-Fa-f]{8}/g;

    return (token) => {
        // magic
    }
}