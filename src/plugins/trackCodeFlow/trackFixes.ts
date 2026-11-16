import { BscFile, BsDiagnostic, BsDiagnosticInput } from 'brighterscript';
import { ChangeEntry, getDiagnosticLocation, replaceText } from '../../textEdit';
import { VarLintError } from './varTracking';

export function extractFixes<T extends BsDiagnostic | BsDiagnosticInput>(
    file: BscFile,
    addFixes: (file: BscFile, changes: ChangeEntry) => void,
    diagnostics: T[]
): T[] {
    return diagnostics.filter(diagnostic => {
        const fix = getFixes(diagnostic);
        if (fix) {
            addFixes(file, fix);
            return false;
        }
        return true;
    });
}

export function getFixes(diagnostic: BsDiagnostic | BsDiagnosticInput): ChangeEntry {
    switch (diagnostic.code) {
        case VarLintError.CaseMismatch:
            return fixCasing(diagnostic);
        default:
            return null;
    }
}

function fixCasing(diagnostic: BsDiagnostic | BsDiagnosticInput) {
    const data: { name: string } = diagnostic.data;
    return {
        diagnostic,
        changes: [
            replaceText(getDiagnosticLocation(diagnostic.location)?.range, data.name)
        ]
    };
}
