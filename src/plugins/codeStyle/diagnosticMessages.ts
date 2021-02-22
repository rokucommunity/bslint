import { DiagnosticSeverity, Range } from 'brighterscript';

enum CodeStyleError {
    InlineIfFound = 'LINT3001',
    InlineIfThenMissing = 'LINT3002',
    InlineIfThenFound = 'LINT3003',
    BlockIfThenMissing = 'LINT3004',
    BlockIfThenFound = 'LINT3005',
    ConditionGroupMissing = 'LINT3006',
    ConditionGroupFound = 'LINT3007',
    SubKeywordExpected = 'LINT3008',
    FunctionKeywordExpected = 'LINT3009',
    ReturnTypeAnnotation = 'LINT3010',
    TypeAnnotation = 'LINT3011',
}

const CS = 'Code style:';
const ST = 'Strictness:';

const messages = {
    addBlockIfThenKeyword: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenMissing,
        message: `${CS} add 'then' keyword`,
        range
    }),
    removeBlockIfThenKeyword: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenFound,
        message: `${CS} remove 'then' keyword`,
        range
    }),
    inlineIfNotAllowed: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfFound,
        message: `${CS} no inline if statement allowed`,
        range
    }),
    addInlineIfThenKeyword: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenMissing,
        message: `${CS} add 'then' keyword`,
        range
    }),
    removeInlineIfThenKeyword: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenFound,
        message: `${CS} remove 'then' keyword`,
        range
    }),
    addParenthesisAroundCondition: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupMissing,
        message: `${CS} add parenthesis around condition`,
        range
    }),
    removeParenthesisAroundCondition: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupFound,
        message: `${CS} remove parenthesis around condition`,
        range
    }),
    expectedKeyword: (range: Range, keyword: string, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.SubKeywordExpected,
        message: `${CS} expected '${keyword}' keyword ${reason}`,
        range
    }),
    expectedReturnTypeAnnotation: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ReturnTypeAnnotation,
        message: `${ST} function should declare the return type`,
        range
    }),
    expectedTypeAnnotation: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.TypeAnnotation,
        message: `${ST} type annotation required`,
        range
    })
};

export default messages;
