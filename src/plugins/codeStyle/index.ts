import { BsDiagnostic, createVisitor, FunctionExpression, isBrsFile, isGroupingExpression, TokenKind, WalkMode, CancellationTokenSource, DiagnosticSeverity, OnGetCodeActionsEvent, AALiteralExpression, isVoidType, CompilerPlugin, AfterFileValidateEvent, Expression, Statement, SymbolTypeFlag } from 'brighterscript';
import { RuleAAComma } from '../..';
import { addFixesToEvent } from '../../textEdit';
import { PluginContext } from '../../util';
import { createColorValidator } from '../../createColorValidator';
import { messages } from './diagnosticMessages';
import { extractFixes } from './styleFixes';
import { BsLintDiagnosticContext } from '../../Linter';

export default class CodeStyle implements CompilerPlugin {

    name: 'codeStyle';

    constructor(private lintContext: PluginContext) {
    }

    onGetCodeActions(event: OnGetCodeActionsEvent) {
        const addFixes = addFixesToEvent(event);
        extractFixes(addFixes, event.diagnostics);
    }

    afterFileValidate(event: AfterFileValidateEvent) {
        const { file } = event;
        if (!isBrsFile(file) || this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: (Omit<BsDiagnostic, 'file'>)[] = [];
        const { severity, fix } = this.lintContext;
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint, noTodo, noStop, aaCommaStyle, eolLast, colorFormat } = severity;
        const validatePrint = noPrint !== DiagnosticSeverity.Hint;
        const validateTodo = noTodo !== DiagnosticSeverity.Hint;
        const validateNoStop = noStop !== DiagnosticSeverity.Hint;
        const validateInlineIf = inlineIfStyle !== 'off';
        const validateColorFormat = (colorFormat === 'hash-hex' || colorFormat === 'quoted-numeric-hex' || colorFormat === 'never');
        const disallowInlineIf = inlineIfStyle === 'never';
        const requireInlineIfThen = inlineIfStyle === 'then';
        const validateBlockIf = blockIfStyle !== 'off';
        const requireBlockIfThen = blockIfStyle === 'then';
        const validateCondition = conditionStyle !== 'off';
        const requireConditionGroup = conditionStyle === 'group';
        const validateAAStyle = aaCommaStyle !== 'off';
        const validateEolLast = eolLast !== 'off';
        const disallowEolLast = eolLast === 'never';
        const validateColorStyle = validateColorFormat ? createColorValidator(severity) : undefined;

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
            // validate function style (`function` or `sub`)
            FunctionExpression: (func) => {
                this.validateFunctionStyle(func, diagnostics);
            },
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
                if (validateColorStyle && e.tokens.value.kind === TokenKind.StringLiteral) {
                    validateColorStyle(e.tokens.value.text, e.tokens.value.range, diagnostics);
                }
            },
            TemplateStringExpression: e => {
                // only validate template strings that look like regular strings (i.e. `0xAABBCC`)
                if (validateColorStyle && e.quasis.length === 1 && e.quasis[0].expressions.length === 1) {
                    validateColorStyle(e.quasis[0].expressions[0].tokens.value.text, e.quasis[0].expressions[0].tokens.value.range, diagnostics);
                }
            },
            AALiteralExpression: e => {
                if (validateAAStyle) {
                    this.validateAAStyle(e, aaCommaStyle, diagnostics);
                }
            },
            StopStatement: s => {
                if (validateNoStop) {
                    diagnostics.push(messages.noStop(s.tokens.stop.range, noStop));
                }
            },
            AstNode: (node: Statement | Expression) => {
                const comments = [...node.getLeadingTrivia(), ...node.getEndTrivia()].filter(t => t.kind === TokenKind.Comment);
                if (validateTodo && comments.length > 0) {
                    for (const e of comments) {
                        if (this.lintContext.todoPattern.test(e.text)) {
                            diagnostics.push(messages.noTodo(e.range, noTodo));
                        }
                    }
                }
            }
        }), { walkMode: WalkMode.visitAllRecursive });

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
        event.program.diagnostics.register(bsDiagnostics, BsLintDiagnosticContext);
    }

    validateAAStyle(aa: AALiteralExpression, aaCommaStyle: RuleAAComma, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        const indexes = collectWrappingAAMembersIndexes(aa);
        const last = indexes.length - 1;
        const isSingleLine = (aa: AALiteralExpression): boolean => {
            return aa.tokens.open.range.start.line === aa.tokens.close.range.end.line;
        };

        indexes.forEach((index, i) => {
            const member = aa.elements[index];
            const hasComma = !!member.tokens.comma;
            if (aaCommaStyle === 'never' || (i === last && ((aaCommaStyle === 'no-dangling') || isSingleLine(aa)))) {
                if (hasComma) {
                    diagnostics.push(messages.removeAAComma(member.tokens.comma.range));
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
        const kind = fun.tokens.functionType.kind;
        const hasReturnedValue = style === 'auto' || typeAnnotations !== 'off' ? this.getFunctionReturns(fun) : false;

        // type annotations
        if (typeAnnotations !== 'off') {
            if (typeAnnotations !== 'args') {
                if (hasReturnedValue && !fun.returnTypeExpression) {
                    diagnostics.push(messages.expectedReturnTypeAnnotation(
                        // add the error to the function keyword (or just highlight the whole function if that's somehow missing)
                        fun.tokens.functionType?.range ?? fun.range
                    ));
                }
            }
            if (typeAnnotations !== 'return') {
                const missingAnnotation = fun.parameters.find(arg => !arg.typeExpression);
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
        if (fun.returnTypeExpression) {
            hasReturnedValue = !isVoidType(fun.returnTypeExpression.getType({ flags: SymbolTypeFlag.typetime }));
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

        const ne = elements[i + 1];
        const hasNL = ne.range.start.line > e.range.end.line;
        if (hasNL) {
            indexes.push(i);
        }
    }
    const last = elements[lastIndex];
    if (last) {
        indexes.push(lastIndex);
    }
    return indexes;
}
