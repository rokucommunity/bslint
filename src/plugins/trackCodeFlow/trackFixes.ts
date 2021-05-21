import { BrsFile, BsDiagnostic, Range } from 'brighterscript';
import { replaceText } from '../../textEdit';
import { PluginContext } from '../../util';
import { VarLintError } from './varTracking';

export function extractFixes(lintContext: PluginContext, file: BrsFile, diagnostics: BsDiagnostic[]): BsDiagnostic[] {
    return diagnostics.filter(diagnostic => {
        switch (diagnostic.code) {
            case VarLintError.CaseMismatch:
                lintContext.addFixes(file, fixCasing(diagnostic.data));
                return false;
            default:
                return true;
        }
    });
}

function fixCasing(data: { name: string; range: Range }) {
    return [
        replaceText(data.range, data.name)
    ];
}
