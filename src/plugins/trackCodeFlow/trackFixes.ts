import { File, BsDiagnostic, Range } from 'brighterscript';
import { ChangeEntry, replaceText } from '../../textEdit';
import { VarLintError } from './varTracking';

export function extractFixes(
    addFixes: (file: File, changes: ChangeEntry) => void,
    diagnostics: BsDiagnostic[]
): BsDiagnostic[] {
    return diagnostics.filter(diagnostic => {
        const fix = getFixes(diagnostic);
        if (fix) {
            addFixes(diagnostic.file, fix);
            return false;
        }
        return true;
    });
}

export function getFixes(diagnostic: BsDiagnostic): ChangeEntry {
    switch (diagnostic.code) {
        case VarLintError.CaseMismatch:
            return fixCasing(diagnostic);
        default:
            return null;
    }
}

function fixCasing(diagnostic: BsDiagnostic) {
    const data: { name: string; range: Range } = diagnostic.data;
    return {
        diagnostic,
        changes: [
            replaceText(data.range, data.name)
        ]
    };
}
