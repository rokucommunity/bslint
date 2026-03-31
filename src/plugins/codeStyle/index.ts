import {
    BscFile,
    XmlFile,
    BsDiagnostic,
    createVisitor,
    FunctionExpression,
    isBrsFile,
    isXmlFile,
    isGroupingExpression,
    TokenKind,
    WalkMode,
    CancellationTokenSource,
    DiagnosticSeverity,
    OnGetCodeActionsEvent,
    isCommentStatement,
    AALiteralExpression,
    AAMemberExpression,
    BrsFile,
    isVariableExpression,
    isLiteralExpression,
    CallExpression,
    isForEachStatement,
    isForStatement,
    isWhileStatement,
    isIfStatement,
    isFunctionExpression,
    AstNode,
    Expression
} from 'brighterscript';
import { RuleAAComma } from '../..';
import { addFixAllToEvent, addFixesToEvent } from '../../textEdit';
import { PluginContext } from '../../util';
import { createColorValidator } from '../../createColorValidator';
import { messages } from './diagnosticMessages';
import { extractFixes, getFixes } from './styleFixes';

export default class CodeStyle {
    name: 'codeStyle';

    constructor(private lintContext: PluginContext) {
    }

    onGetCodeActions(event: OnGetCodeActionsEvent) {
        const addFixes = addFixesToEvent(event);
        extractFixes(addFixes, event.diagnostics);

        // For each fixable code touched by the cursor, offer "fix all" if there are
        // multiple occurrences of that code across the whole file
        const handledCodes = new Set<string | number>();
        for (const diagnostic of event.diagnostics) {
            if (handledCodes.has(diagnostic.code) || !getFixes(diagnostic)) {
                continue;
            }
            const allInFile = event.program.getDiagnostics()
                .filter(x => x.file === event.file && x.code === diagnostic.code);
            if (allInFile.length > 1) {
                handledCodes.add(diagnostic.code);
                addFixAllToEvent(event, allInFile.map(d => getFixes(d)).filter(Boolean));
            }
        }
    }

    validateXMLFile(file: XmlFile) {
        const diagnostics: Omit<BsDiagnostic, 'file'>[] = [];
        const { noArrayComponentFieldType, noAssocarrayComponentFieldType } = this.lintContext.severity;

        const validateArrayComponentFieldType = noArrayComponentFieldType !== DiagnosticSeverity.Hint;
        const validateAssocarrayComponentFieldType = noAssocarrayComponentFieldType !== DiagnosticSeverity.Hint;

        for (const field of file.parser?.ast?.component?.api?.fields ?? []) {
            const { tag, attributes } = field;
            if (tag.text === 'field') {
                const typeAttribute = attributes.find(({ key }) => key.text === 'type');

                const typeValue = typeAttribute?.value.text?.toLowerCase();
                if (typeValue === 'array' && validateArrayComponentFieldType) {
                    diagnostics.push(
                        messages.noArrayFieldType(
                            typeAttribute.value.range,
                            noArrayComponentFieldType
                        )
                    );
                } else if (typeValue === 'assocarray' && validateAssocarrayComponentFieldType) {
                    diagnostics.push(
                        messages.noAssocarrayFieldType(
                            typeAttribute.value.range,
                            noAssocarrayComponentFieldType
                        )
                    );
                }
            }
        }

        return diagnostics;
    }

    /**
     * Collect BRS diagnostics that don't require an AST walk (eol-last, regex).
     * Top-level comment checks are NOT included here — those are handled separately
     * via checkTopLevelComments before the combined AST walk.
     */
    collectBrsPreWalkDiagnostics(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        const { severity } = this.lintContext;
        const { noRegexDuplicates, eolLast } = severity;
        const validateEolLast = eolLast !== 'off';
        const disallowEolLast = eolLast === 'never';
        const validateNoRegexDuplicates = noRegexDuplicates !== DiagnosticSeverity.Hint;

        const { tokens } = file.parser;
        let isFileEmpty = true;
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].kind !== TokenKind.Eof &&
                tokens[i].kind !== TokenKind.Newline) {
                isFileEmpty = false;
                break;
            }
        }

        if (validateEolLast && !isFileEmpty) {
            const penultimateToken = tokens[tokens.length - 2];
            if (disallowEolLast) {
                if (penultimateToken?.kind === TokenKind.Newline) {
                    diagnostics.push(messages.removeEolLast(penultimateToken.range));
                }
            } else if (penultimateToken?.kind !== TokenKind.Newline) {
                let preferredEol;
                for (let i = tokens.length - 1; i >= 0; i--) {
                    if (tokens[i].kind === TokenKind.Newline) {
                        preferredEol = tokens[i].text;
                    }
                }
                diagnostics.push(messages.addEolLast(penultimateToken.range, preferredEol));
            }
        }

        if (validateNoRegexDuplicates) {
            this.validateRegex(file, diagnostics, noRegexDuplicates);
        }
    }

    /**
     * Check top-level comment statements (outside function bodies) for TODO patterns.
     * The combined AST walk is per-function, so top-level statements must be checked separately.
     */
    checkTopLevelComments(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        const { noTodo } = this.lintContext.severity;
        if (noTodo === DiagnosticSeverity.Hint) {
            return;
        }
        for (const stmt of file.ast.statements) {
            if (isCommentStatement(stmt) && this.lintContext.todoPattern.test(stmt.text)) {
                diagnostics.push(messages.noTodo(stmt.range, noTodo));
            }
        }
    }

    /**
     * Returns a visitor function for use in a combined AST walk (e.g. inside TrackCodeFlow's walk).
     * The visitor collects diagnostics into the provided array without walking the AST itself.
     */
    createBrsVisitor(diagnostics: (Omit<BsDiagnostic, 'file'>)[]): ReturnType<typeof createVisitor> {
        const { severity } = this.lintContext;
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint, noTodo, noStop, aaCommaStyle, colorFormat } = severity;
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
        const validateColorStyle = validateColorFormat ? createColorValidator(severity) : undefined;

        return createVisitor({
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
                if (validateColorStyle && e.token.kind === TokenKind.StringLiteral) {
                    validateColorStyle(e.token.text, e.token.range, diagnostics);
                }
            },
            TemplateStringExpression: e => {
                if (validateColorStyle && e.quasis.length === 1 && e.quasis[0].expressions.length === 1) {
                    validateColorStyle(e.quasis[0].expressions[0].token.text, e.quasis[0].expressions[0].token.range, diagnostics);
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
        });
    }

    /**
     * Validate function-level style rules (keyword, type annotations) for all functions in the file.
     */
    collectBrsFunctionDiagnostics(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[]) {
        for (const fun of file.parser.references.functionExpressions) {
            this.validateFunctionStyle(fun, diagnostics);
        }
    }

    validateRegex(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[], severity: DiagnosticSeverity) {
        for (const fun of file.parser.references.functionExpressions) {
            const regexes = new Set();
            for (const callExpression of fun.callExpressions) {
                if (!this.isCreateObject(callExpression)) {
                    continue;
                }

                // Check if all args are literals and get them as string
                const callArgs = this.getLiteralArgs(callExpression.args);

                // CreateObject for roRegex expects 3 params,
                // they should be literals because only in this case we can guarante that call regex is the same
                if (callArgs?.length === 3 && callArgs[0] === 'roRegex') {
                    const parentStatement = callExpression.findAncestor((node, cancel) => {
                        if (isIfStatement(node)) {
                            cancel.cancel();
                        } else if (this.isLoop(node) || isFunctionExpression(node)) {
                            return true;
                        }
                    });

                    const joinedArgs = callArgs.join();
                    const isRegexAlreadyExist = regexes.has(joinedArgs);
                    if (!isRegexAlreadyExist) {
                        regexes.add(joinedArgs);
                    }

                    if (isFunctionExpression(parentStatement)) {
                        if (isRegexAlreadyExist) {
                            diagnostics.push(messages.noRegexRedeclaring(callExpression.range, severity));
                        }
                    } else if (this.isLoop(parentStatement)) {
                        diagnostics.push(messages.noIdenticalRegexInLoop(callExpression.range, severity));
                    }
                }
            }
        }
    }

    afterFileValidate(file: BscFile) {
        if (this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: (Omit<BsDiagnostic, 'file'>)[] = [];

        if (isXmlFile(file)) {
            diagnostics.push(...this.validateXMLFile(file));
        } else if (isBrsFile(file)) {
            // Eol-last and regex (token/reference scan — no AST walk needed)
            this.collectBrsPreWalkDiagnostics(file, diagnostics);

            // Full-file walk: covers all statements and expressions including top-level comments
            const { aaCommaStyle, colorFormat } = this.lintContext.severity;
            const walkExpressions = aaCommaStyle !== 'off' ||
                colorFormat === 'hash-hex' || colorFormat === 'quoted-numeric-hex' || colorFormat === 'never';
            file.ast.walk(this.createBrsVisitor(diagnostics), {
                walkMode: walkExpressions ? WalkMode.visitAllRecursive : WalkMode.visitStatementsRecursive
            });

            // Function keyword / type annotation checks
            this.collectBrsFunctionDiagnostics(file, diagnostics);
        }

        let bsDiagnostics: BsDiagnostic[] = diagnostics.map(d => ({ ...d, file }));
        if (this.lintContext.fix) {
            bsDiagnostics = extractFixes(this.lintContext.addFixes, bsDiagnostics);
        }
        file.addDiagnostics(bsDiagnostics);
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

    private isLoop(node: AstNode) {
        return isForStatement(node) || isForEachStatement(node) || isWhileStatement(node);
    }

    private isCreateObject(s: CallExpression) {
        return isVariableExpression(s.callee) && s.callee.name.text.toLowerCase() === 'createobject';
    }

    private getLiteralArgs(args: Expression[]) {
        const argsStringValue: string[] = [];
        for (const arg of args) {
            if (isLiteralExpression(arg)) {
                argsStringValue.push(arg?.token?.text?.replace(/"/g, ''));
            } else {
                return;
            }
        }

        return argsStringValue;
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
