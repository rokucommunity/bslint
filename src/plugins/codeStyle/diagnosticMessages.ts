import { DiagnosticSeverity, FunctionExpression, IfStatement, Location, WhileStatement } from 'brighterscript';

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
    NoRegexDuplicates = 'LINT3026',
    NameShadowing = 'LINT3027'
}

const CS = 'Code style:';
const ST = 'Strictness:';

export const messages = {
    addBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        location: stat.tokens.if.location,
        data: stat
    }),
    removeBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        location: stat.tokens.then.location,
        data: stat
    }),
    inlineIfNotAllowed: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfFound,
        source: 'bslint',
        message: `${CS} no inline if statement allowed`,
        location
    }),
    addInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        location: stat.tokens.if.location,
        data: stat
    }),
    removeInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        location: stat.tokens.then.location,
        data: stat
    }),
    addParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupMissing,
        source: 'bslint',
        message: `${CS} add parenthesis around condition`,
        location: stat.condition.location,
        data: stat
    }),
    removeParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupFound,
        source: 'bslint',
        message: `${CS} remove parenthesis around condition`,
        location: stat.condition.location,
        data: stat
    }),
    expectedSubKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.SubKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'sub' keyword ${reason}`,
        location: fun.tokens.functionType.location,
        data: fun
    }),
    expectedFunctionKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.FunctionKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'function' keyword ${reason}`,
        location: fun.tokens.functionType.location,
        data: fun
    }),
    expectedReturnTypeAnnotation: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ReturnTypeAnnotation,
        source: 'bslint',
        message: `${ST} function should declare the return type`,
        location
    }),
    expectedTypeAnnotation: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.TypeAnnotation,
        source: 'bslint',
        message: `${ST} type annotation required`,
        location
    }),
    noPrint: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoPrint,
        source: 'bslint',
        message: `${CS} Avoid using direct Print statements`,
        location
    }),
    noTodo: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoTodo,
        source: 'bslint',
        message: `${CS} Avoid using TODO comments`,
        location
    }),
    noStop: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoStop,
        source: 'bslint',
        message: `${CS} STOP statements are not allowed in published applications`,
        location
    }),
    removeAAComma: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaFound,
        source: 'bslint',
        message: `Remove optional comma`,
        location
    }),
    addAAComma: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaMissing,
        source: 'bslint',
        message: `Add comma after the expression`,
        location
    }),
    addEolLast: (location: Location, preferredEol: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastMissing,
        source: 'bslint',
        message: `${CS} File should end with a newline`,
        location,
        data: { preferredEol }
    }),
    removeEolLast: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastFound,
        source: 'bslint',
        message: `${CS} File should not end with a newline`,
        location
    }),
    expectedColorFormat: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorFormat,
        source: 'bslint',
        message: `${CS} File should follow color format`,
        location
    }),
    expectedColorCase: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCase,
        source: 'bslint',
        message: `${CS} File should follow color case`,
        location
    }),
    expectedColorAlpha: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlpha,
        source: 'bslint',
        message: `${CS} File should follow color alpha rule`,
        location
    }),
    expectedColorAlphaDefaults: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlphaDefaults,
        source: 'bslint',
        message: `${CS} File should follow color alpha defaults rule`,
        location
    }),
    colorCertCompliance: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCertCompliant,
        source: 'bslint',
        message: `${CS} File should follow Roku broadcast safe color cert requirement`,
        location
    }),
    noAssocarrayFieldType: (location: Location, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'assocarray'`,
        code: CodeStyleError.NoAssocarrayFieldType,
        severity: severity,
        source: 'bslint',
        location
    }),
    noArrayFieldType: (location: Location, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'array'`,
        code: CodeStyleError.NoArrayFieldType,
        severity: severity,
        source: 'bslint',
        location
    }),
    nameShadowing: (thisThingKind: string, thatThingKind: string, thatThingName: string, severity: DiagnosticSeverity) => ({
        message: `${ST} ${thisThingKind} has same name as ${thatThingKind ? thatThingKind + ' ' : ''}'${thatThingName}'`,
        code: CodeStyleError.NameShadowing,
        severity: severity,
        source: 'bslint'
    }),
    typeReassignment: (location: Location, varName: string, previousType: string, newType: string, severity: DiagnosticSeverity) => ({
        message: `${ST} Reassignment of the type of '${varName}' from ${previousType} to ${newType}`,
        code: CodeStyleError.NameShadowing,
        severity: severity,
        source: 'bslint',
        location
    }),
    noIdenticalRegexInLoop: (location: Location, severity: DiagnosticSeverity) => ({
        message: 'Avoid redeclaring identical regular expressions in a loop',
        code: CodeStyleError.NoRegexDuplicates,
        severity: severity,
        source: 'bslint',
        location
    }),
    noRegexRedeclaring: (location: Location, severity: DiagnosticSeverity) => ({
        message: 'Avoid redeclaring identical regular expressions',
        code: CodeStyleError.NoRegexDuplicates,
        severity: severity,
        source: 'bslint',
        location
    })
};
