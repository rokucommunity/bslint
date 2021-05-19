import { BscFile, BsDiagnostic, createVisitor, FunctionExpression, isBrsFile, isGroupingExpression, Program, TokenKind, WalkMode, CancellationTokenSource } from 'brighterscript';
import { PluginContext, resolveContext } from '../../util';
import messages from './diagnosticMessages';

export default class CodeStyle {

    name: 'codeStyle';

    lintContext: PluginContext;

    constructor(program: Program) {
        this.lintContext = resolveContext(program);
    }

    afterFileValidate(file: BscFile) {
        if (!isBrsFile(file) || this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: (Omit<BsDiagnostic, 'file'>)[] = [];
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint } = this.lintContext.severity;
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
                            ? messages.addBlockIfThenKeyword(s.tokens.if.range)
                            : messages.removeBlockIfThenKeyword(s.tokens.then.range)
                        );
                    }
                } else if (s.isInline && validateInlineIf) {
                    if (disallowInlineIf) {
                        diagnostics.push(messages.inlineIfNotAllowed(s.range));
                    } else if (hasThenToken !== requireInlineIfThen) {
                        diagnostics.push(requireInlineIfThen
                            ? messages.addInlineIfThenKeyword(s.tokens.if.range)
                            : messages.removeInlineIfThenKeyword(s.tokens.then.range)
                        );
                    }
                }

                if (validateCondition) {
                    if (isGroupingExpression(s.condition) !== requireConditionGroup) {
                        diagnostics.push(requireConditionGroup
                            ? messages.addParenthesisAroundCondition(s.condition.range)
                            : messages.removeParenthesisAroundCondition(s.condition.range)
                        );
                    }
                }
            },
            PrintStatement: s => {
                diagnostics.push(messages.noPrint(s.tokens.print.range, noPrint));
            }
        }), { walkMode: WalkMode.visitStatementsRecursive });

        // validate function style (`function` or `sub`)
        for (const fun of file.parser.references.functionExpressions) {
            this.validateFunctionStyle(file, fun);
        }

        // append diagnostics
        file.addDiagnostics(
            diagnostics.map(diagnostic => ({
                ...diagnostic,
                file
            }))
        );
    }

    validateFunctionStyle(file: BscFile, fun: FunctionExpression) {
        const { namedFunctionStyle, anonFunctionStyle, typeAnnotations } = this.lintContext.severity;
        const style = fun.functionStatement ? namedFunctionStyle : anonFunctionStyle;
        const kind = fun.functionType.kind;
        const hasReturnedValue = style === 'auto' || typeAnnotations !== 'off' ? this.getFunctionReturns(fun) : false;

        // type annotations
        if (typeAnnotations !== 'off') {
            if (typeAnnotations !== 'args') {
                if (hasReturnedValue && !fun.returnTypeToken) {
                    file.addDiagnostics([{
                        ...messages.expectedReturnTypeAnnotation(fun.range),
                        file
                    }]);
                }
            }
            if (typeAnnotations !== 'return') {
                const missingAnnotation = fun.parameters.find(arg => !arg.typeToken);
                if (missingAnnotation) {
                    // only report 1st missing arg annotation to avoid error overload
                    file.addDiagnostics([{
                        ...messages.expectedTypeAnnotation(missingAnnotation.range),
                        file
                    }]);
                }
            }
        }

        // keyword style
        if (style === 'off') {
            return;
        }
        if (style === 'no-function') {
            if (kind === TokenKind.Function) {
                file.addDiagnostics([{
                    ...messages.expectedKeyword(fun.functionType.range, 'sub', `(always use 'sub')`),
                    file
                }]);
            }
            return;
        }

        if (style === 'no-sub') {
            if (kind === TokenKind.Sub) {
                file.addDiagnostics([{
                    ...messages.expectedKeyword(fun.functionType.range, 'function', `(always use 'function')`),
                    file
                }]);
            }
            return;
        }

        // auto
        if (hasReturnedValue) {
            if (kind !== TokenKind.Function) {
                file.addDiagnostics([{
                    ...messages.expectedKeyword(fun.functionType.range, 'function', `(use 'function' when a value is returned)`),
                    file
                }]);
            }
        } else if (kind !== TokenKind.Sub) {
            file.addDiagnostics([{
                ...messages.expectedKeyword(fun.functionType.range, 'sub', `(use 'sub' when no value is returned)`),
                file
            }]);
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
