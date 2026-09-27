import { BscFile, BsDiagnostic, Location } from 'brighterscript';
import { ChangeEntry, replaceText } from '../../textEdit';
import { VarLintError } from './varTracking';

export function extractFixes(
    file: BscFile,
    addFixes: (file: BscFile, changes: ChangeEntry) => void,
    diagnostics: BsDiagnostic[]
): BsDiagnostic[] {
    return diagnostics.filter(diagnostic => {
        const fix = getFixes(diagnostic);
        if (fix) {
            addFixes(file, fix);
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
    const data: { name: string; location: Location } = diagnostic.data;
    return {
        diagnostic,
        changes: [
            replaceText(data.location.range, data.name)
        ]
    };
}
