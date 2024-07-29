import { DiagnosticSeverity, FunctionExpression, IfStatement, Range, WhileStatement } from 'brighterscript';

export enum CodeStyleError {
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
    NoPrint = 'LINT3012',
    AACommaFound = 'LINT3013',
    AACommaMissing = 'LINT3014',
    NoTodo = 'LINT3015',
    NoStop = 'LINT3016',
    EolLastMissing = 'LINT3017',
    EolLastFound = 'LINT3018',
    ColorFormat = 'LINT3019',
    ColorCase = 'LINT3020',
    ColorAlpha = 'LINT3021',
    ColorAlphaDefaults = 'LINT3022',
    ColorCertCompliant = 'LINT3023',
    NoAssocarrayFieldType = 'LINT3024',
    NoArrayFieldType = 'LINT3025',
    NoCreateChildInLoop = 'LINT3027'
}

const CS = 'Code style:';
const ST = 'Strictness:';

export const messages = {
    addBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        range: stat.tokens.if.location.range,
        data: stat
    }),
    removeBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        range: stat.tokens.then.location.range,
        data: stat
    }),
    inlineIfNotAllowed: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfFound,
        source: 'bslint',
        message: `${CS} no inline if statement allowed`,
        range
    }),
    addInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        range: stat.tokens.if.location.range,
        data: stat
    }),
    removeInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        range: stat.tokens.then.location.range,
        data: stat
    }),
    addParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupMissing,
        source: 'bslint',
        message: `${CS} add parenthesis around condition`,
        range: stat.condition.location.range,
        data: stat
    }),
    removeParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupFound,
        source: 'bslint',
        message: `${CS} remove parenthesis around condition`,
        range: stat.condition.location.range,
        data: stat
    }),
    expectedSubKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.SubKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'sub' keyword ${reason}`,
        range: fun.tokens.functionType.location.range,
        data: fun
    }),
    expectedFunctionKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.FunctionKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'function' keyword ${reason}`,
        range: fun.tokens.functionType.location.range,
        data: fun
    }),
    expectedReturnTypeAnnotation: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ReturnTypeAnnotation,
        source: 'bslint',
        message: `${ST} function should declare the return type`,
        range
    }),
    expectedTypeAnnotation: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.TypeAnnotation,
        source: 'bslint',
        message: `${ST} type annotation required`,
        range
    }),
    noPrint: (range: Range, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoPrint,
        source: 'bslint',
        message: `${CS} Avoid using direct Print statements`,
        range
    }),
    noTodo: (range: Range, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoTodo,
        source: 'bslint',
        message: `${CS} Avoid using TODO comments`,
        range
    }),
    noStop: (range: Range, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoStop,
        source: 'bslint',
        message: `${CS} STOP statements are not allowed in published applications`,
        range
    }),
    removeAAComma: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaFound,
        source: 'bslint',
        message: `Remove optional comma`,
        range
    }),
    addAAComma: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaMissing,
        source: 'bslint',
        message: `Add comma after the expression`,
        range
    }),
    addEolLast: (range: Range, preferredEol: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastMissing,
        source: 'bslint',
        message: `${CS} File should end with a newline`,
        range,
        data: { preferredEol }
    }),
    removeEolLast: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastFound,
        source: 'bslint',
        message: `${CS} File should not end with a newline`,
        range
    }),
    expectedColorFormat: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorFormat,
        source: 'bslint',
        message: `${CS} File should follow color format`,
        range
    }),
    expectedColorCase: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCase,
        source: 'bslint',
        message: `${CS} File should follow color case`,
        range
    }),
    expectedColorAlpha: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlpha,
        source: 'bslint',
        message: `${CS} File should follow color alpha rule`,
        range
    }),
    expectedColorAlphaDefaults: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlphaDefaults,
        source: 'bslint',
        message: `${CS} File should follow color alpha defaults rule`,
        range
    }),
    colorCertCompliance: (range: Range) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCertCompliant,
        source: 'bslint',
        message: `${CS} File should follow Roku broadcast safe color cert requirement`,
        range
    }),
    noAssocarrayFieldType: (range: Range, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'assocarray'`,
        code: CodeStyleError.NoAssocarrayFieldType,
        severity: severity,
        source: 'bslint',
        range
    }),
    noArrayFieldType: (range: Range, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'array'`,
        code: CodeStyleError.NoArrayFieldType,
        severity: severity,
        source: 'bslint',
        range
    }),
    NoCreateChildInLoop: (range: Range, severity: DiagnosticSeverity) => ({
        severity,
        code: CodeStyleError.NoCreateChildInLoop,
        source: 'bslint',
        message: 'Avoid setting a value to node field after its creation within the same loop',
        range
    })
};
