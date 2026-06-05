import { DiagnosticSeverity, FunctionExpression, IfStatement, Location, WhileStatement } from 'brighterscript';

export enum CodeStyleLegacyError {
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
    NameShadowing = 'LINT3127',
    ForTerminatorEndForExpected = 'LINT3027',
    ForTerminatorNextExpected = 'LINT3028'
}

export enum CodeStyleError {
    InlineIfFound = 'inline-if-found',
    InlineIfThenMissing = 'missing-inline-if-then',
    InlineIfThenFound = 'inline-if-then-found',
    BlockIfThenMissing = 'missing-block-if-then',
    BlockIfThenFound = 'block-if-then-found',
    ConditionGroupMissing = 'missing-condition-group',
    ConditionGroupFound = 'condition-group-found',
    SubKeywordExpected = 'missing-sub-keyword',
    FunctionKeywordExpected = 'missing-function-keyword',
    ReturnTypeAnnotation = 'missing-return-type',
    TypeAnnotation = 'missing-type',
    NoPrint = 'no-print',
    AACommaFound = 'aa-comma-found',
    AACommaMissing = 'missing-aa-comma',
    NoTodo = 'no-todo',
    NoStop = 'no-stop',
    EolLastMissing = 'missing-eol-last',
    EolLastFound = 'eol-last-found',
    ColorFormat = 'color-format',
    ColorCase = 'color-case',
    ColorAlpha = 'color-alpha',
    ColorAlphaDefaults = 'color-alpha-defaults',
    ColorCertCompliant = 'color-cert-compliant',
    NoAssocarrayFieldType = 'no-assocarray-field-type',
    NoArrayFieldType = 'no-array-field-type',
    NoRegexDuplicates = 'no-regex-duplicates',
    NameShadowing = 'name-shadowing',
    TypeReassignment = 'type-reassignment',
    ForTerminatorEndForExpected = 'missing-end-for',
    ForTerminatorNextExpected = 'missing-next'
}

const CS = 'Code style:';
const ST = 'Strictness:';

export const messages = {
    addBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenMissing,
        legacyCode: CodeStyleLegacyError.BlockIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        location: stat.tokens.if.location,
        data: stat
    }),
    removeBlockIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.BlockIfThenFound,
        legacyCode: CodeStyleLegacyError.BlockIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        location: stat.tokens.then.location,
        data: stat
    }),
    inlineIfNotAllowed: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfFound,
        legacyCode: CodeStyleLegacyError.InlineIfFound,
        source: 'bslint',
        message: `${CS} no inline if statement allowed`,
        location
    }),
    addInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenMissing,
        legacyCode: CodeStyleLegacyError.InlineIfThenMissing,
        source: 'bslint',
        message: `${CS} add 'then' keyword`,
        location: stat.tokens.if.location,
        data: stat
    }),
    removeInlineIfThenKeyword: (stat: IfStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.InlineIfThenFound,
        legacyCode: CodeStyleLegacyError.InlineIfThenFound,
        source: 'bslint',
        message: `${CS} remove 'then' keyword`,
        location: stat.tokens.then.location,
        data: stat
    }),
    addParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupMissing,
        legacyCode: CodeStyleLegacyError.ConditionGroupMissing,
        source: 'bslint',
        message: `${CS} add parenthesis around condition`,
        location: stat.condition.location,
        data: stat
    }),
    removeParenthesisAroundCondition: (stat: IfStatement | WhileStatement) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ConditionGroupFound,
        legacyCode: CodeStyleLegacyError.ConditionGroupFound,
        source: 'bslint',
        message: `${CS} remove parenthesis around condition`,
        location: stat.condition.location,
        data: stat
    }),
    expectedSubKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.SubKeywordExpected,
        legacyCode: CodeStyleLegacyError.SubKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'sub' keyword ${reason}`,
        location: fun.tokens.functionType.location,
        data: fun
    }),
    expectedFunctionKeyword: (fun: FunctionExpression, reason: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.FunctionKeywordExpected,
        legacyCode: CodeStyleLegacyError.FunctionKeywordExpected,
        source: 'bslint',
        message: `${CS} expected 'function' keyword ${reason}`,
        location: fun.tokens.functionType.location,
        data: fun
    }),
    expectedReturnTypeAnnotation: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ReturnTypeAnnotation,
        legacyCode: CodeStyleLegacyError.ReturnTypeAnnotation,
        source: 'bslint',
        message: `${ST} function should declare the return type`,
        location
    }),
    expectedTypeAnnotation: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.TypeAnnotation,
        legacyCode: CodeStyleLegacyError.TypeAnnotation,
        source: 'bslint',
        message: `${ST} type annotation required`,
        location
    }),
    noPrint: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoPrint,
        legacyCode: CodeStyleLegacyError.NoPrint,
        source: 'bslint',
        message: `${CS} Avoid using direct Print statements`,
        location
    }),
    noTodo: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoTodo,
        legacyCode: CodeStyleLegacyError.NoTodo,
        source: 'bslint',
        message: `${CS} Avoid using TODO comments`,
        location
    }),
    noStop: (location: Location, severity: DiagnosticSeverity) => ({
        severity: severity,
        code: CodeStyleError.NoStop,
        legacyCode: CodeStyleLegacyError.NoStop,
        source: 'bslint',
        message: `${CS} STOP statements are not allowed in published applications`,
        location
    }),
    removeAAComma: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaFound,
        legacyCode: CodeStyleLegacyError.AACommaFound,
        source: 'bslint',
        message: `Remove optional comma`,
        location
    }),
    addAAComma: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.AACommaMissing,
        legacyCode: CodeStyleLegacyError.AACommaMissing,
        source: 'bslint',
        message: `Add comma after the expression`,
        location
    }),
    addEolLast: (location: Location, preferredEol: string) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastMissing,
        legacyCode: CodeStyleLegacyError.EolLastMissing,
        source: 'bslint',
        message: `${CS} File should end with a newline`,
        location,
        data: { preferredEol }
    }),
    removeEolLast: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.EolLastFound,
        legacyCode: CodeStyleLegacyError.EolLastFound,
        source: 'bslint',
        message: `${CS} File should not end with a newline`,
        location
    }),
    expectedColorFormat: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorFormat,
        legacyCode: CodeStyleLegacyError.ColorFormat,
        source: 'bslint',
        message: `${CS} File should follow color format`,
        location
    }),
    expectedColorCase: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCase,
        legacyCode: CodeStyleLegacyError.ColorCase,
        source: 'bslint',
        message: `${CS} File should follow color case`,
        location
    }),
    expectedColorAlpha: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlpha,
        legacyCode: CodeStyleLegacyError.ColorAlpha,
        source: 'bslint',
        message: `${CS} File should follow color alpha rule`,
        location
    }),
    expectedColorAlphaDefaults: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorAlphaDefaults,
        legacyCode: CodeStyleLegacyError.ColorAlphaDefaults,
        source: 'bslint',
        message: `${CS} File should follow color alpha defaults rule`,
        location
    }),
    colorCertCompliance: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ColorCertCompliant,
        legacyCode: CodeStyleLegacyError.ColorCertCompliant,
        source: 'bslint',
        message: `${CS} File should follow Roku broadcast safe color cert requirement`,
        location
    }),
    noAssocarrayFieldType: (location: Location, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'assocarray'`,
        code: CodeStyleError.NoAssocarrayFieldType,
        legacyCode: CodeStyleLegacyError.NoAssocarrayFieldType,
        severity: severity,
        source: 'bslint',
        location
    }),
    noArrayFieldType: (location: Location, severity: DiagnosticSeverity) => ({
        message: `Avoid using field type 'array'`,
        code: CodeStyleError.NoArrayFieldType,
        legacyCode: CodeStyleLegacyError.NoArrayFieldType,
        severity: severity,
        source: 'bslint',
        location
    }),
    nameShadowing: (thisThingKind: string, thatThingKind: string, thatThingName: string, severity: DiagnosticSeverity) => ({
        message: `${ST} ${thisThingKind} has same name as ${thatThingKind ? thatThingKind + ' ' : ''}'${thatThingName}'`,
        code: CodeStyleError.NameShadowing,
        legacyCode: CodeStyleLegacyError.NameShadowing,
        severity: severity,
        source: 'bslint'
    }),
    typeReassignment: (location: Location, varName: string, previousType: string, newType: string, severity: DiagnosticSeverity) => ({
        message: `${ST} Reassignment of the type of '${varName}' from ${previousType} to ${newType}`,
        code: CodeStyleError.TypeReassignment,
        severity: severity,
        source: 'bslint',
        location
    }),
    noIdenticalRegexInLoop: (location: Location, severity: DiagnosticSeverity) => ({
        message: 'Avoid redeclaring identical regular expressions in a loop',
        code: CodeStyleError.NoRegexDuplicates,
        legacyCode: CodeStyleLegacyError.NoRegexDuplicates,
        severity: severity,
        source: 'bslint',
        location
    }),
    noRegexRedeclaring: (location: Location, severity: DiagnosticSeverity) => ({
        message: 'Avoid redeclaring identical regular expressions',
        code: CodeStyleError.NoRegexDuplicates,
        legacyCode: CodeStyleLegacyError.NoRegexDuplicates,
        severity: severity,
        source: 'bslint',
        location
    }),
    expectedEndForTerminator: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ForTerminatorEndForExpected,
        legacyCode: CodeStyleLegacyError.ForTerminatorEndForExpected,
        source: 'bslint',
        message: `${CS} expected 'end for' terminator`,
        location
    }),
    expectedNextTerminator: (location: Location) => ({
        severity: DiagnosticSeverity.Error,
        code: CodeStyleError.ForTerminatorNextExpected,
        legacyCode: CodeStyleLegacyError.ForTerminatorNextExpected,
        source: 'bslint',
        message: `${CS} expected 'next' terminator`,
        location
    })
};
