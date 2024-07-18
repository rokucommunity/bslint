import { DiagnosticSeverity, Range } from 'brighterscript';

export enum CodePerformanceError {
    XmlNotRecommendedTypes = 'LINT5001'
}

export const messages = {
    xmlNotRecommendedFieldType: (name: string, range: Range, severity: DiagnosticSeverity) => ({
        message: `Using ${name} type in component markup can result in inefficient copying of data during transfer to the render thread. Use ‘node’ type if possible for more efficient transfer of data from the task thread to the render thread`,
        code: CodePerformanceError.XmlNotRecommendedTypes,
        severity: severity,
        source: 'bslint',
        range
    }),
};
