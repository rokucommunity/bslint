import { BsDiagnostic, DiagnosticSeverity, DiagnosticTag, Location } from 'brighterscript';
import { CodeDescription, DiagnosticRelatedInformation } from 'vscode-languageserver-types';
import { expect } from 'chai';
import { firstBy } from 'thenby';

type DiagnosticCollection = { getDiagnostics: () => Array<BsDiagnostic> } | { diagnostics: BsDiagnostic[] } | BsDiagnostic[];
function getDiagnostics(arg: DiagnosticCollection): BsDiagnostic[] {
    if (Array.isArray(arg)) {
        return arg;
    } else if ((arg as any).getDiagnostics) {
        return (arg as any).getDiagnostics();
    } else if ((arg as any).diagnostics) {
        return (arg as any).diagnostics;
    } else {
        throw new Error('Cannot derive a list of diagnostics from ' + JSON.stringify(arg));
    }
}

function sortDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics.sort(
        firstBy<BsDiagnostic>('code')
            .thenBy<BsDiagnostic>('message')
            .thenBy<BsDiagnostic>((a, b) => (a.location.range?.start?.line ?? 0) - (b.location.range?.start?.line ?? 0))
            .thenBy<BsDiagnostic>((a, b) => (a.location.range?.start?.character ?? 0) - (b.location.range?.start?.character ?? 0))
            .thenBy<BsDiagnostic>((a, b) => (a.location.range?.end?.line ?? 0) - (b.location.range?.end?.line ?? 0))
            .thenBy<BsDiagnostic>((a, b) => (a.location.range?.end?.character ?? 0) - (b.location.range?.end?.character ?? 0))
    );
}

function cloneObject<TOriginal, TTemplate>(original: TOriginal, template: TTemplate, defaultKeys: Array<keyof TOriginal>) {
    const clone = {} as Partial<TOriginal>;
    let keys = Object.keys(template ?? {}) as Array<keyof TOriginal>;
    // if there were no keys provided, use some sane defaults
    keys = keys.length > 0 ? keys : defaultKeys;

    // copy only compare the specified keys from actualDiagnostic
    for (const key of keys) {
        clone[key] = original[key];
    }
    return clone;
}

interface PartialDiagnostic {
    location?: Partial<Location>;
    severity?: DiagnosticSeverity;
    code?: number | string;
    codeDescription?: Partial<CodeDescription>;
    source?: string;
    message?: string;
    tags?: Partial<DiagnosticTag>[];
    relatedInformation?: Partial<DiagnosticRelatedInformation>[];
    data?: unknown;
}

/**
 *  Helper function to clone a Diagnostic so it will give partial data that has the same properties as the expected
 */
function cloneDiagnostic(actualDiagnosticInput: BsDiagnostic, expectedDiagnostic: BsDiagnostic) {
    const actualDiagnostic = cloneObject(
        actualDiagnosticInput,
        expectedDiagnostic,
        ['message', 'code', 'location', 'severity', 'relatedInformation']
    );
    // deep clone relatedInformation if available
    if (actualDiagnostic.relatedInformation) {
        for (let j = 0; j < actualDiagnostic.relatedInformation.length; j++) {
            actualDiagnostic.relatedInformation[j] = cloneObject(
                actualDiagnostic.relatedInformation[j],
                expectedDiagnostic?.relatedInformation[j],
                ['location', 'message']
            ) as any;
        }
    }
    // deep clone file info if available
    if (actualDiagnostic.location) {
        actualDiagnostic.location = cloneObject(
            actualDiagnostic.location,
            expectedDiagnostic?.location,
            ['uri', 'range']
        ) as any;
    }
    return actualDiagnostic;
}


/**
 * Ensure the DiagnosticCollection exactly contains the data from expected list.
 * @param arg - any object that contains diagnostics (such as `Program`, `Scope`, or even an array of diagnostics)
 * @param expected an array of expected diagnostics. if it's a string, assume that's a diagnostic error message
 */
export function expectDiagnostics(arg: DiagnosticCollection, expected: Array<PartialDiagnostic | string | number>) {
    const actualDiagnostics = sortDiagnostics(
        getDiagnostics(arg)
    );
    const expectedDiagnostics = sortDiagnostics(
        expected.map(x => {
            let result = x;
            if (typeof x === 'string') {
                result = { message: x };
            } else if (typeof x === 'number') {
                result = { code: x };
            }
            return result as unknown as BsDiagnostic;
        })
    );

    const actual = [] as BsDiagnostic[];
    for (let i = 0; i < actualDiagnostics.length; i++) {
        const expectedDiagnostic = expectedDiagnostics[i];
        const actualDiagnostic = cloneDiagnostic(actualDiagnostics[i], expectedDiagnostic);
        actual.push(actualDiagnostic as any);
    }
    expect(actual).to.eql(expectedDiagnostics);
}


function pad(n: number) {
    return n > 9 ? `${n}` : `0${n}`;
}

export function fmtDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics
        .filter((d) => d.severity && d.severity < 4)
        .sort((a, b) => a.location.range.start.line - b.location.range.start.line)
        .map((d) => `${pad(d.location.range.start.line + 1)}:${d.code}:${d.message}`)
        .map(d => d.trim())
        .sort();
}

/**
 * Format a list of diagnostics and ensure they match the expectedDiagnostics string list
 */
export function expectDiagnosticsFmt(diagnosticCollection: DiagnosticCollection, expectedDiagnostics: string[]) {
    const diagnostics = getDiagnostics(diagnosticCollection);
    const formatted = fmtDiagnostics(diagnostics);
    expect(
        formatted
    ).eql(
        expectedDiagnostics
    );
}
