import { BscFile, BsDiagnostic, createVisitor, FunctionExpression, isBrsFile, isGroupingExpression, TokenKind, WalkMode, CancellationTokenSource, DiagnosticSeverity, OnGetCodeActionsEvent, isCommentStatement, AALiteralExpression, LiteralExpression, AAMemberExpression } from 'brighterscript';
import { RuleAAComma, RuleColorFormat, RuleColorCase, RuleColorAlpha, RuleColorAlphaDefaults, RuleColorCertCompliant } from '../..';
import { addFixesToEvent } from '../../textEdit';
import { PluginContext } from '../../util';
import { messages } from './diagnosticMessages';
import { extractFixes } from './styleFixes';

export default class CodeStyle {

    name: 'codeStyle';

    constructor(private lintContext: PluginContext) {
    }

    onGetCodeActions(event: OnGetCodeActionsEvent) {
        const addFixes = addFixesToEvent(event);
        extractFixes(addFixes, event.diagnostics);
    }

    afterFileValidate(file: BscFile) {
        if (!isBrsFile(file) || this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: (Omit<BsDiagnostic, 'file'>)[] = [];
        const { severity, fix } = this.lintContext;
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint, noTodo, noStop, aaCommaStyle, eolLast } = severity;
        const { colorFormat, colorCase, colorAlpha, colorAlphaDefaults, colorCertCompliant } = severity;
        const validatePrint = noPrint !== DiagnosticSeverity.Hint;
        const validateTodo = noTodo !== DiagnosticSeverity.Hint;
        const validateNoStop = noStop !== DiagnosticSeverity.Hint;
        const validateInlineIf = inlineIfStyle !== 'off';
        const validateColorFormat = (colorFormat === 'hash' || colorFormat === 'zero-x' || colorFormat === 'never');
        const disallowInlineIf = inlineIfStyle === 'never';
        const requireInlineIfThen = inlineIfStyle === 'then';
        const validateBlockIf = blockIfStyle !== 'off';
        const requireBlockIfThen = blockIfStyle === 'then';
        const validateCondition = conditionStyle !== 'off';
        const requireConditionGroup = conditionStyle === 'group';
        const validateAAStyle = aaCommaStyle !== 'off';
        const walkExpressions = validateAAStyle;
        const validateEolLast = eolLast !== 'off';
        const disallowEolLast = eolLast === 'never';

        // Check if the file is empty by going backwards from the last token,
        // meaning there are tokens other than `Eof` and `Newline`.
        const { tokens } = file.parser;
        let isFileEmpty = true;
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].kind !== TokenKind.Eof &&
                tokens[i].kind !== TokenKind.Newline) {
                isFileEmpty = false;
                break;
            }
        }

        // Validate `eol-last` on non-empty files
        if (validateEolLast && !isFileEmpty) {
            const penultimateToken = tokens[tokens.length - 2];
            if (disallowEolLast) {
                if (penultimateToken?.kind === TokenKind.Newline) {
                    diagnostics.push(messages.removeEolLast(penultimateToken.range));
                }
            } else if (penultimateToken?.kind !== TokenKind.Newline) {
                // Set the preferredEol as the last newline.
                // The fix function will handle the case where preferredEol is undefined.
                // This could happen in valid single line files, like:
                // `sub foo() end sub\EOF`
                let preferredEol;
                for (let i = tokens.length - 1; i >= 0; i--) {
                    if (tokens[i].kind === TokenKind.Newline) {
                        preferredEol = tokens[i].text;
                    }
                }

                diagnostics.push(
                    messages.addEolLast(
                        penultimateToken.range,
                        preferredEol
                    )
                );
            }
        }

        file.ast.walk(createVisitor({
            IfStatement: s => {
                const hasThenToken = !!s.tokens.then;
                if (!s.isInline && validateBlockIf) {
                    if (hasThenToken !== requireBlockIfThen) {
                        diagnostics.push(requireBlockIfThen
                            ? messages.addBlockIfThenKeyword(s)
                            : messages.removeBlockIfThenKeyword(s)
                        );
                    }
                } else if (s.isInline && validateInlineIf) {
                    if (disallowInlineIf) {
                        diagnostics.push(messages.inlineIfNotAllowed(s.range));
                    } else if (hasThenToken !== requireInlineIfThen) {
                        diagnostics.push(requireInlineIfThen
                            ? messages.addInlineIfThenKeyword(s)
                            : messages.removeInlineIfThenKeyword(s)
                        );
                    }
                }

                if (validateCondition) {
                    if (isGroupingExpression(s.condition) !== requireConditionGroup) {
                        diagnostics.push(requireConditionGroup
                            ? messages.addParenthesisAroundCondition(s)
                            : messages.removeParenthesisAroundCondition(s)
                        );
                    }
                }
            },
            WhileStatement: s => {
                if (validateCondition) {
                    if (isGroupingExpression(s.condition) !== requireConditionGroup) {
                        diagnostics.push(requireConditionGroup
                            ? messages.addParenthesisAroundCondition(s)
                            : messages.removeParenthesisAroundCondition(s)
                        );
                    }
                }
            },
            PrintStatement: s => {
                if (validatePrint) {
                    diagnostics.push(messages.noPrint(s.tokens.print.range, noPrint));
                }
            },
            LiteralExpression: e => {
                if (e.token.kind === TokenKind.StringLiteral) {
                    if (validateColorFormat) {
                        this.validateColorStyle(e.token, diagnostics, colorFormat, colorCase, colorAlpha, colorAlphaDefaults, colorCertCompliant);
                    }
                }
            },
            AALiteralExpression: e => {
                if (validateAAStyle) {
                    this.validateAAStyle(e, aaCommaStyle, diagnostics);
                }
            },
            CommentStatement: e => {
                if (validateTodo) {
                    if (this.lintContext.todoPattern.test(e.text)) {
                        diagnostics.push(messages.noTodo(e.range, noTodo));
                    }
                }
            },
            StopStatement: s => {
                if (validateNoStop) {
                    diagnostics.push(messages.noStop(s.tokens.stop.range, noStop));
                }
            }
        }), { walkMode: walkExpressions ? WalkMode.visitAllRecursive : WalkMode.visitStatementsRecursive });

        // validate function style (`function` or `sub`)
        for (const fun of file.parser.references.functionExpressions) {
            this.validateFunctionStyle(fun, diagnostics);
        }

        // add file reference
        let bsDiagnostics: BsDiagnostic[] = diagnostics.map(diagnostic => ({
            ...diagnostic,
            file
        }));

        // apply fix
        if (fix) {
            bsDiagnostics = extractFixes(this.lintContext.addFixes, bsDiagnostics);
        }

        // append diagnostics
        file.addDiagnostics(bsDiagnostics);
    }

    validateColorStyle(token: LiteralExpression, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorFormat: RuleColorFormat, colorCase: RuleColorCase, alpha: RuleColorAlpha, alphaDefaults: RuleColorAlphaDefaults, certCompliant: RuleColorCertCompliant) {
        const colorHashRegex = /#[0-9A-Fa-f]{6}/g;
        const colorHashAlphaRegex = /#[0-9A-Fa-f]{8}/g;
        const colorZeroXRegex = /0x[0-9A-Fa-f]{6}/g;
        const colorZeroXAlphaRegex = /0x[0-9A-Fa-f]{8}/g;
        const colorHashMatches = token.text.match(colorHashRegex);
        const colorHashAlphaMatches = token.text.match(colorHashAlphaRegex);
        const colorZeroXMatches = token.text.match(colorZeroXRegex);
        const colorZeroXAlphaMatches = token.text.match(colorZeroXAlphaRegex);

        if (colorFormat === 'hash') {
            if (colorZeroXMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(token.range));
            }
            this.validateColorCase(colorHashMatches, token, diagnostics, colorCase, colorFormat);
            this.validateColorAlpha(colorHashAlphaMatches, colorHashMatches, colorZeroXMatches, token, diagnostics, alpha, alphaDefaults);
            this.validateColorCertCompliance(colorHashMatches, token, diagnostics, colorFormat, certCompliant);

        } else if (colorFormat === 'zero-x') {
            if (colorHashMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(token.range));
            }
            this.validateColorCase(colorZeroXMatches, token, diagnostics, colorCase, colorFormat);
            this.validateColorAlpha(colorZeroXAlphaMatches, colorHashMatches, colorZeroXMatches, token, diagnostics, alpha, alphaDefaults);
            this.validateColorCertCompliance(colorZeroXMatches, token, diagnostics, colorFormat, certCompliant);

        } else if (colorFormat === 'never') {
            if (colorZeroXMatches !== null || colorHashMatches !== null) {
                diagnostics.push(messages.expectedColorFormat(token.range));
            }
        }
    }

    validateColorAlpha(alphaMatches: RegExpMatchArray, hashMatches: RegExpMatchArray, zeroXMatches: RegExpMatchArray, token: LiteralExpression, diagnostics: (Omit<BsDiagnostic, 'file'>)[], alpha: RuleColorAlpha, alphaDefaults: RuleColorAlphaDefaults) {
        const validateColorAlpha = (alpha === 'never' || alpha === 'always' || alpha === 'allowed');
        if (validateColorAlpha) {
            if (alpha === 'never' && alphaMatches !== null) {
                diagnostics.push(messages.expectedColorAlpha(token.range));
            }
            if ((alpha === 'always' && alphaMatches === null) && (hashMatches !== null || zeroXMatches !== null)) {
                diagnostics.push(messages.expectedColorAlpha(token.range));
            }
            if ((alphaDefaults === 'never' || alphaDefaults === 'only-hidden') && alphaMatches !== null) {
                for (let i = 0; i < alphaMatches.length; i++) {
                    const colorHashAlpha = alphaMatches[i];
                    const alphaValue = colorHashAlpha.slice(-2).toLowerCase();
                    if (alphaValue === 'ff' || (alphaDefaults === 'never' && alphaValue === '00')) {
                        diagnostics.push(messages.expectedColorAlphaDefaults(token.range));
                    }
                }
            }
        }
    }

    validateColorCase(matches: RegExpMatchArray, token: LiteralExpression, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorCase: RuleColorCase, colorFormat: RuleColorFormat) {
        const validateColorCase = colorCase === 'upper' || colorCase === 'lower';
        if (validateColorCase && matches !== null) {
            let colorValue = matches[0];
            const charsToStrip = (colorFormat === 'hash') ? 1 : 2;
            colorValue = colorValue.substring(charsToStrip);
            for (let i = 0; i < colorValue.length; i++) {
                const char = colorValue.charAt(i);
                if (colorCase === 'lower' && char === char.toUpperCase() && char !== char.toLowerCase()) {
                    diagnostics.push(messages.expectedColorCase(token.range));
                    break;
                }
                if (colorCase === 'upper' && char === char.toLowerCase() && char !== char.toUpperCase()) {
                    diagnostics.push(messages.expectedColorCase(token.range));
                    break;
                }
            }
        }
    }

    validateColorCertCompliance(matches: RegExpMatchArray, token: LiteralExpression, diagnostics: (Omit<BsDiagnostic, 'file'>)[], colorFormat: RuleColorFormat, certCompliant: RuleColorCertCompliant) {
        const validateCertCompliant = certCompliant === 'always';
        if (validateCertCompliant && matches !== null) {
            const BROADCAST_SAFE_BLACK = '161616';
            const BROADCAST_SAFE_WHITE = 'DBDBDB';
            const MAX_BLACK_LUMA = this.getColorLuma(BROADCAST_SAFE_BLACK);
            const MAX_WHITE_LUMA = this.getColorLuma(BROADCAST_SAFE_WHITE);
            let colorValue = matches[0];
            const charsToStrip = (colorFormat === 'hash') ? 1 : 2;
            colorValue = colorValue.substring(charsToStrip);
            const colorLuma = this.getColorLuma(colorValue);
            if (colorLuma > MAX_WHITE_LUMA || colorLuma < MAX_BLACK_LUMA) {
                diagnostics.push(messages.colorCertCompliance(token.range));
            }
        }
    }

    getColorLuma(value: string) {
        let luma = -1;
        // TODO: do we need to check value has alpha?
        const rgb = parseInt(value, 16); // Convert rrggbb to decimal
        const red = (rgb >> 16) & 0xff;
        const green = (rgb >> 8) & 0xff;
        const blue = (rgb >> 0) & 0xff;
        luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue; // Per ITU-R BT.709
        return luma;
    }

    validateAAStyle(aa: AALiteralExpression, aaCommaStyle: RuleAAComma, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        const indexes = collectWrappingAAMembersIndexes(aa);
        const last = indexes.length - 1;
        const isSingleLine = (aa: AALiteralExpression): boolean => {
            return aa.open.range.start.line === aa.close.range.end.line;
        };

        indexes.forEach((index, i) => {
            const member = aa.elements[index] as AAMemberExpression;
            const hasComma = !!member.commaToken;
            if (aaCommaStyle === 'never' || (i === last && ((aaCommaStyle === 'no-dangling') || isSingleLine(aa)))) {
                if (hasComma) {
                    diagnostics.push(messages.removeAAComma(member.commaToken.range));
                }
            } else if (!hasComma) {
                diagnostics.push(messages.addAAComma(member.value.range));
            }
        });
    }

    validateFunctionStyle(fun: FunctionExpression, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        const { severity } = this.lintContext;
        const { namedFunctionStyle, anonFunctionStyle, typeAnnotations } = severity;
        const style = fun.functionStatement ? namedFunctionStyle : anonFunctionStyle;
        const kind = fun.functionType.kind;
        const hasReturnedValue = style === 'auto' || typeAnnotations !== 'off' ? this.getFunctionReturns(fun) : false;

        // type annotations
        if (typeAnnotations !== 'off') {
            if (typeAnnotations !== 'args') {
                if (hasReturnedValue && !fun.returnTypeToken) {
                    diagnostics.push(messages.expectedReturnTypeAnnotation(
                        // add the error to the function keyword (or just highlight the whole function if that's somehow missing)
                        fun.functionType?.range ?? fun.range
                    ));
                }
            }
            if (typeAnnotations !== 'return') {
                const missingAnnotation = fun.parameters.find(arg => !arg.typeToken);
                if (missingAnnotation) {
                    // only report 1st missing arg annotation to avoid error overload
                    diagnostics.push(messages.expectedTypeAnnotation(missingAnnotation.range));
                }
            }
        }

        // keyword style
        if (style === 'off') {
            return;
        }
        if (style === 'no-function') {
            if (kind === TokenKind.Function) {
                diagnostics.push(messages.expectedSubKeyword(fun, `(always use 'sub')`));
            }
            return;
        }

        if (style === 'no-sub') {
            if (kind === TokenKind.Sub) {
                diagnostics.push(messages.expectedFunctionKeyword(fun, `(always use 'function')`));
            }
            return;
        }

        // auto
        if (hasReturnedValue) {
            if (kind !== TokenKind.Function) {
                diagnostics.push(messages.expectedFunctionKeyword(fun, `(use 'function' when a value is returned)`));
            }
        } else if (kind !== TokenKind.Sub) {
            diagnostics.push(messages.expectedSubKeyword(fun, `(use 'sub' when no value is returned)`));
        }
    }

    getFunctionReturns(fun: FunctionExpression) {
        let hasReturnedValue = false;
        if (fun.returnTypeToken) {
            hasReturnedValue = fun.returnTypeToken.kind !== TokenKind.Void;
        } else {
            const cancel = new CancellationTokenSource();
            fun.body.walk(createVisitor({
                ReturnStatement: s => {
                    hasReturnedValue = !!s.value;
                    cancel.cancel();
                }
            }), { walkMode: WalkMode.visitStatements, cancel: cancel.token });
        }
        return hasReturnedValue;
    }
}

/**
 * Collect indexes of non-inline AA members
 */
export function collectWrappingAAMembersIndexes(aa: AALiteralExpression): number[] {
    const indexes: number[] = [];
    const { elements } = aa;
    const lastIndex = elements.length - 1;
    for (let i = 0; i < lastIndex; i++) {
        const e = elements[i];
        if (isCommentStatement(e)) {
            continue;
        }
        const ne = elements[i + 1];
        const hasNL = isCommentStatement(ne) || ne.range.start.line > e.range.end.line;
        if (hasNL) {
            indexes.push(i);
        }
    }
    const last = elements[lastIndex];
    if (last && !isCommentStatement(last)) {
        indexes.push(lastIndex);
    }
    return indexes;
}
