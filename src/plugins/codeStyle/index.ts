import { BscFile, BsDiagnostic, createVisitor, FunctionExpression, isBrsFile, isGroupingExpression, TokenKind, WalkMode, CancellationTokenSource, DiagnosticSeverity, OnGetCodeActionsEvent } from 'brighterscript';
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
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint } = severity;
        const validatePrint = noPrint !== DiagnosticSeverity.Hint;
        const validateInlineIf = inlineIfStyle !== 'off';
        const disallowInlineIf = inlineIfStyle === 'never';
        const requireInlineIfThen = inlineIfStyle === 'then';
        const validateBlockIf = blockIfStyle !== 'off';
        const requireBlockIfThen = blockIfStyle === 'then';
        const validateCondition = conditionStyle !== 'off';
        const requireConditionGroup = conditionStyle === 'group';

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
            }
        }), { walkMode: WalkMode.visitStatementsRecursive });

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
                    diagnostics.push(messages.expectedReturnTypeAnnotation(fun.range));
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
