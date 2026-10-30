import {
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
    ProvideCodeActionsEvent,
    AALiteralExpression,
    BrsFile,
    AfterValidateFileEvent,
    Expression,
    isVoidType,
    Statement,
    SymbolTypeFlag,
    XmlFile,
    AstNode,
    Token,
    isNamespaceStatement,
    util,
    isAnyReferenceType,
    ExtraSymbolData,
    InternalWalkMode,
    isCallableType,
    AssignmentStatement,
    isFunctionExpression,
    isDynamicType,
    Plugin,
    CallExpression,
    isForEachStatement,
    isForStatement,
    isIfStatement,
    isLiteralExpression,
    isVariableExpression,
    isWhileStatement,
    isCallExpression,
    ValidateScopeEvent,
    ImportStatement,
    isImportStatement,
    isAAIndexedMemberExpression,
    isAAMemberExpression,
    isXmlScope,
    XmlScope,
    FileReference
} from 'brighterscript';
import { RuleAAComma } from '../..';
import { addFixAllToEvent, addFixesToEvent } from '../../textEdit';
import { CodeActionKind, codeActionUtil } from 'brighterscript/dist/CodeActionUtil';
import { bscCompat, PluginContext } from '../../util';
import { createColorValidator } from '../../createColorValidator';
import { CodeStyleError, messages } from './diagnosticMessages';
import { addComponentExtends, extractFixes, getFixes } from './styleFixes';
import { BsLintDiagnosticContext, BsLintDiagnosticTag } from '../../Linter';
import { Location } from 'vscode-languageserver-types';

const RedundantScriptImportTag = 'BSLint_RedundantScriptImport';

export default class CodeStyle implements Plugin {

    name = 'bslint-codeStyle';

    constructor(private lintContext: PluginContext) {
    }

    provideCodeActions(event: ProvideCodeActionsEvent) {
        const addFixes = addFixesToEvent(event);
        extractFixes(event.file, addFixes, event.diagnostics);

        // `extends="Group"` is the preferred fix, but offer the other common base components too
        for (const diagnostic of event.diagnostics) {
            if (diagnostic.code === CodeStyleError.MissingComponentExtends) {
                for (const parentName of ['Task', 'ContentNode']) {
                    const entry = addComponentExtends(diagnostic, parentName);
                    event.codeActions.push(codeActionUtil.createCodeAction({
                        title: `Code style: add extends="${parentName}"`,
                        diagnostics: [diagnostic],
                        kind: CodeActionKind.QuickFix,
                        changes: entry.changes.map(change => ({
                            type: 'replace',
                            filePath: event.file.srcPath,
                            range: change.range,
                            newText: change.text
                        }))
                    }));
                }
            }
        }

        // For each fixable code touched by the cursor, offer "fix all" if there are
        // multiple occurrences of that code across the whole file
        const handledCodes = new Set<string | number>();
        for (const diagnostic of event.diagnostics) {
            if (handledCodes.has(diagnostic.code) || !getFixes(diagnostic)) {
                continue;
            }
            const allInFile = event.program.getDiagnostics()
                .filter(x => x.location.uri === util.pathToUri(event.file.srcPath) && x.code === diagnostic.code);
            if (allInFile.length > 1) {
                handledCodes.add(diagnostic.code);
                addFixAllToEvent(event, allInFile.map(d => getFixes(d)).filter(Boolean));
            }
        }
    }

    validateXMLFile(file: XmlFile) {
        const diagnostics: BsDiagnostic[] = [];
        const { noArrayComponentFieldType, noAssocarrayComponentFieldType, missingComponentExtends } = this.lintContext.severity;

        const validateArrayComponentFieldType = noArrayComponentFieldType !== DiagnosticSeverity.Hint;
        const validateAssocarrayComponentFieldType = noAssocarrayComponentFieldType !== DiagnosticSeverity.Hint;
        // older brighterscript versions report this themselves
        const validateMissingComponentExtends = missingComponentExtends !== DiagnosticSeverity.Hint && !bscCompat.reportsDiagnostic('xmlComponentMissingExtendsAttribute');

        const componentElement = file.parser?.ast?.componentElement;
        if (validateMissingComponentExtends && componentElement && !componentElement.extends) {
            // insert after the last attribute, or right after `<component` if there are none
            const lastAttribute = componentElement.attributes[componentElement.attributes.length - 1];
            const insertPosition = (lastAttribute?.location ?? componentElement.tokens.startTagName.location).range.end;
            diagnostics.push(
                messages.missingComponentExtends(
                    componentElement.tokens.startTagName.location,
                    insertPosition,
                    missingComponentExtends
                )
            );
        }

        for (const field of file.parser?.ast?.componentElement?.interfaceElement?.fields ?? []) {
            if (field.tokens.startTagName?.text?.toLowerCase() === 'field') {
                const typeAttribute = field.getAttribute('type');

                const typeValue = typeAttribute?.tokens?.value?.text?.toLowerCase();
                if (typeValue === 'array' && validateArrayComponentFieldType) {
                    diagnostics.push(
                        messages.noArrayFieldType(
                            typeAttribute?.tokens?.value?.location,
                            noArrayComponentFieldType
                        )
                    );
                } else if (typeValue === 'assocarray' && validateAssocarrayComponentFieldType) {
                    diagnostics.push(
                        messages.noAssocarrayFieldType(
                            typeAttribute?.tokens?.value?.location,
                            noAssocarrayComponentFieldType
                        )
                    );
                }
            }
        }

        return diagnostics;
    }

    validateBrsFile(file: BrsFile) {
        const diagnostics: (BsDiagnostic)[] = [];
        const { severity } = this.lintContext;
        const { inlineIfStyle, blockIfStyle, conditionStyle, noPrint, sortedImports, noTodo, noStop, aaCommaStyle, eolLast, colorFormat, noRegexDuplicates, forTerminatorStyle } = severity;
        const validatePrint = noPrint !== DiagnosticSeverity.Hint;
        const validateSortedImports = sortedImports !== DiagnosticSeverity.Hint;
        const validateTodo = noTodo !== DiagnosticSeverity.Hint;
        const validateNoStop = noStop !== DiagnosticSeverity.Hint;
        const validateNoRegexDuplicates = noRegexDuplicates !== DiagnosticSeverity.Hint;
        const validateInlineIf = inlineIfStyle !== 'off';
        const validateColorFormat = (colorFormat === 'hash-hex' || colorFormat === 'quoted-numeric-hex' || colorFormat === 'never');
        const disallowInlineIf = inlineIfStyle === 'never';
        const requireInlineIfThen = inlineIfStyle === 'then';
        const validateBlockIf = blockIfStyle !== 'off';
        const requireBlockIfThen = blockIfStyle === 'then';
        const validateCondition = conditionStyle !== 'off';
        const requireConditionGroup = conditionStyle === 'group';
        const validateAAStyle = aaCommaStyle !== 'off';
        const validateForTerminator = forTerminatorStyle !== 'off';
        const requireForTerminatorNext = forTerminatorStyle === 'next';
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
                    diagnostics.push(messages.removeEolLast(penultimateToken.location));
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
                        penultimateToken.location,
                        preferredEol
                    )
                );
            }
        }

        if (validateNoRegexDuplicates) {
            this.validateRegex(file, diagnostics, noRegexDuplicates);
        }

        if (validateSortedImports) {
            this.validateSortedImports(file, diagnostics, sortedImports);
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
                        diagnostics.push(messages.inlineIfNotAllowed(s.location));
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
                    diagnostics.push(messages.noPrint(s.tokens.print.location, noPrint));
                }
            },
            LiteralExpression: e => {
                if (validateColorStyle && e.tokens.value.kind === TokenKind.StringLiteral) {
                    validateColorStyle(e.tokens.value.text, e.tokens.value.location, diagnostics);
                }
            },
            TemplateStringExpression: e => {
                // only validate template strings that look like regular strings (i.e. `0xAABBCC`)
                if (validateColorStyle && e.quasis.length === 1 && e.quasis[0].expressions.length === 1) {
                    validateColorStyle(e.quasis[0].expressions[0].tokens.value.text, e.quasis[0].expressions[0].tokens.value.location, diagnostics);
                }
            },
            AALiteralExpression: e => {
                if (validateAAStyle) {
                    this.validateAAStyle(e, aaCommaStyle, diagnostics);
                }
            },
            StopStatement: s => {
                if (validateNoStop) {
                    diagnostics.push(messages.noStop(s.tokens.stop.location, noStop));
                }
            },
            AstNode: (node: Statement | Expression) => {
                const comments = [...node.leadingTrivia ?? [], ...node.endTrivia ?? []].filter(t => t.kind === TokenKind.Comment);
                if (validateTodo && comments.length > 0) {
                    for (const e of comments) {
                        if (this.lintContext.todoPattern.test(e.text)) {
                            diagnostics.push(messages.noTodo(e.location, noTodo));
                        }
                    }
                }
            },
            ForStatement: s => {
                if (validateForTerminator) {
                    validateForTerminatorToken(s.tokens.endFor, requireForTerminatorNext, diagnostics);
                }
            },
            ForEachStatement: s => {
                if (validateForTerminator) {
                    validateForTerminatorToken(s.tokens.endFor, requireForTerminatorNext, diagnostics);
                }
            }
        }), { walkMode: WalkMode.visitAllRecursive });

        return diagnostics;
    }

    validateBrsFileInScope(file: BrsFile) {
        const diagnostics: (BsDiagnostic)[] = [];
        const { severity } = this.lintContext;
        const { nameShadowing, typeReassignment } = severity;

        file.ast.walk(createVisitor({
            NamespaceStatement: (nsStmt) => {
                this.validateNameShadowing(file, nsStmt, nsStmt.getNameParts()?.[0], nameShadowing, diagnostics);
            },
            ClassStatement: (classStmt) => {
                this.validateNameShadowing(file, classStmt, classStmt.tokens.name, nameShadowing, diagnostics);
            },
            InterfaceStatement: (ifaceStmt) => {
                this.validateNameShadowing(file, ifaceStmt, ifaceStmt.tokens.name, nameShadowing, diagnostics);
            },
            ConstStatement: (constStmt) => {
                this.validateNameShadowing(file, constStmt, constStmt.tokens.name, nameShadowing, diagnostics);
            },
            EnumStatement: (enumStmt) => {
                this.validateNameShadowing(file, enumStmt, enumStmt.tokens.name, nameShadowing, diagnostics);
            },
            AssignmentStatement: (assignStmt) => {
                this.validateTypeReassignment(file, assignStmt, typeReassignment, diagnostics);
            }
            // eslint-disable-next-line no-bitwise
        }), { walkMode: WalkMode.visitStatementsRecursive | InternalWalkMode.visitFalseConditionalCompilationBlocks });

        return diagnostics;
    }

    validateRegex(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[], severity: DiagnosticSeverity) {
        const regexesByFunction = new Map<FunctionExpression, Set<string>>();

        const callExpressions = file.parser.ast.findChildren<CallExpression>(node => {
            return isCallExpression(node) && this.isCreateObject(node);
        });
        // walk all callExpressions
        for (const callExpression of callExpressions) {
            const func = callExpression.findAncestor<FunctionExpression>(isFunctionExpression);
            if (!func) {
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

                if (!regexesByFunction.has(func)) {
                    regexesByFunction.set(func, new Set<string>());
                }
                const regexes = regexesByFunction.get(func);

                const joinedArgs = callArgs.join();
                const isRegexAlreadyExist = regexes.has(joinedArgs);
                if (!isRegexAlreadyExist) {
                    regexes.add(joinedArgs);
                }

                if (isFunctionExpression(parentStatement)) {
                    if (isRegexAlreadyExist) {
                        diagnostics.push(messages.noRegexRedeclaring(callExpression.location, severity));
                    }
                } else if (this.isLoop(parentStatement)) {
                    diagnostics.push(messages.noIdenticalRegexInLoop(callExpression.location, severity));
                }
            }
        }
    }

    /**
      * Imports are split into groups by blank lines; each group must be sorted alphabetically on its own.
      */
    validateSortedImports(file: BrsFile, diagnostics: (Omit<BsDiagnostic, 'file'>)[], severity: DiagnosticSeverity) {
        const imports = file.parser.ast.findChildren<ImportStatement>(isImportStatement);

        const groups: ImportStatement[][] = [];
        let currentGroup: ImportStatement[] = [];
        let previous: ImportStatement | undefined;
        for (const stat of imports) {
            if (previous && stat.location.range.start.line - previous.location.range.end.line > 1) {
                groups.push(currentGroup);
                currentGroup = [];
            }
            currentGroup.push(stat);
            previous = stat;
        }
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        for (const group of groups) {
            for (let i = 1; i < group.length; i++) {
                const previousPath = group[i - 1].filePath?.toLowerCase() ?? '';
                const currentPath = group[i].filePath?.toLowerCase() ?? '';
                if (currentPath < previousPath) {
                    diagnostics.push(messages.unsortedImport(group[i].location, severity));
                }
            }
        }
    }


    afterValidateFile(event: AfterValidateFileEvent) {
        const { file } = event;
        if (this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: (BsDiagnostic)[] = [];
        if (isXmlFile(file)) {
            diagnostics.push(...this.validateXMLFile(file));
        } else if (isBrsFile(file)) {
            diagnostics.push(...this.validateBrsFile(file));
        }

        // add file reference
        let bsDiagnostics: BsDiagnostic[] = diagnostics.map(diagnostic => ({
            ...diagnostic,
            file
        }));

        const { fix } = this.lintContext;

        // apply fix
        if (fix) {
            bsDiagnostics = extractFixes(event.file, this.lintContext.addFixes, bsDiagnostics);
        }

        // append diagnostics
        event.program.diagnostics.register(bsDiagnostics, BsLintDiagnosticContext);
    }

    validateScope(event: ValidateScopeEvent) {
        if (isXmlScope(event.scope)) {
            this.validateXmlScope(event, event.scope);
        }

        for (const file of event.scope.getOwnFiles()) {
            if (this.lintContext.ignores(file)) {
                return;
            }

            const diagnostics: (BsDiagnostic)[] = [];
            if (isBrsFile(file)) {
                diagnostics.push(...this.validateBrsFileInScope(file));
            }

            // add file reference
            let bsDiagnostics: BsDiagnostic[] = diagnostics.map(diagnostic => ({
                ...diagnostic,
                file
            }));

            const { fix } = this.lintContext;

            // apply fix
            if (fix) {
                bsDiagnostics = extractFixes(file, this.lintContext.addFixes, bsDiagnostics);
            }

            // append diagnostics
            event.program.diagnostics.register(bsDiagnostics, BsLintDiagnosticContext);
        }
    }

    /**
     * Detect when a component imports a script that one of its ancestor components already imports
     */
    validateXmlScope(event: ValidateScopeEvent, scope: XmlScope) {
        const { xmlFile } = scope;
        // ancestors can change without this file changing, so clear the previous results for this scope
        event.program.diagnostics.clearByFilter({ scope: scope, fileUri: util.pathToUri(xmlFile?.srcPath), tag: RedundantScriptImportTag });

        const { noRedundantScriptImport } = this.lintContext.severity;
        // older brighterscript versions report this themselves
        if (noRedundantScriptImport === DiagnosticSeverity.Hint || bscCompat.reportsDiagnostic('unnecessaryScriptImportInChildFromParent')) {
            return;
        }
        if (!xmlFile?.parentComponent || this.lintContext.ignores(xmlFile)) {
            return;
        }

        // keep the first occurrence of each path. Closest ancestor imports come first
        const ancestorImports = new Map<string, FileReference>();
        for (const ancestorImport of xmlFile.getAncestorScriptTagImports()) {
            if (!ancestorImports.has(ancestorImport.destPath)) {
                ancestorImports.set(ancestorImport.destPath, ancestorImport);
            }
        }

        let diagnostics: BsDiagnostic[] = [];
        for (const scriptImport of xmlFile.scriptTagImports) {
            const ancestorImport = ancestorImports.get(scriptImport.destPath);
            if (ancestorImport && scriptImport.filePathRange) {
                const ancestorComponent = ancestorImport.sourceFile as XmlFile;
                diagnostics.push({
                    ...messages.redundantScriptImport(
                        util.createLocationFromFileRange(xmlFile, scriptImport.filePathRange),
                        ancestorComponent.componentName?.text ?? ancestorComponent.destPath,
                        noRedundantScriptImport
                    ),
                    file: xmlFile
                } as BsDiagnostic);
            }
        }

        if (this.lintContext.fix) {
            diagnostics = extractFixes(xmlFile, this.lintContext.addFixes, diagnostics);
        }

        event.program.diagnostics.register(diagnostics, {
            tags: [BsLintDiagnosticTag, RedundantScriptImportTag],
            scope: scope
        });
    }

    validateAAStyle(aa: AALiteralExpression, aaCommaStyle: RuleAAComma, diagnostics: (BsDiagnostic)[]) {
        const indexes = collectWrappingAAMembersIndexes(aa);
        const last = indexes.length - 1;
        const isSingleLine = (aa: AALiteralExpression): boolean => {
            return aa.tokens.open.location.range.start.line === aa.tokens.close.location.range.end.line;
        };

        indexes.forEach((index, i) => {
            const member = aa.elements[index];
            if (isAAIndexedMemberExpression(member) || isAAMemberExpression(member)) {
                const hasComma = !!member.tokens.comma;
                if (aaCommaStyle === 'never' || (i === last && ((aaCommaStyle === 'no-dangling') || isSingleLine(aa)))) {
                    if (hasComma) {
                        diagnostics.push(messages.removeAAComma(member.tokens.comma.location));
                    }
                } else if (!hasComma) {
                    diagnostics.push(messages.addAAComma(member.value?.location));
                }
            }
        });
    }

    validateFunctionStyle(fun: FunctionExpression, diagnostics: (BsDiagnostic)[]) {
        const { severity } = this.lintContext;
        const { namedFunctionStyle, anonFunctionStyle, typeAnnotations } = severity;
        const style = fun.parent ? namedFunctionStyle : anonFunctionStyle;
        const kind = fun.tokens.functionType.kind;
        const hasReturnedValue = style === 'auto' || typeAnnotations !== 'off' ? this.getFunctionReturns(fun) : false;

        // type annotations
        if (typeAnnotations !== 'off') {
            const needsArgType = typeAnnotations.startsWith('args') || typeAnnotations.startsWith('all');
            const needsReturnType = typeAnnotations.startsWith('return') || typeAnnotations.startsWith('all');
            const allowImplicit = typeAnnotations.includes('allow-implicit');

            if (needsReturnType) {
                if (hasReturnedValue && !fun.returnTypeExpression) {
                    diagnostics.push(messages.expectedReturnTypeAnnotation(
                        // add the error to the function keyword (or just highlight the whole function if that's somehow missing)
                        fun.tokens.functionType?.location ?? fun.location
                    ));
                }
            }
            if (needsArgType) {
                const missingAnnotation = fun.parameters.find(arg => {
                    if (!arg.typeExpression) {
                        if (allowImplicit && arg.defaultValue) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                });
                if (missingAnnotation) {
                    // only report 1st missing arg annotation to avoid error overload
                    diagnostics.push(messages.expectedTypeAnnotation(missingAnnotation.location));
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

    validateNameShadowing(file: BrsFile, node: AstNode, nameIdentifier: Token, severity: DiagnosticSeverity, diagnostics: (BsDiagnostic)[]) {
        const name = nameIdentifier?.text;
        if (!name || !node) {
            return;
        }
        const nameLocation = nameIdentifier.location;

        const astTable = file.ast.getSymbolTable();
        const data = {} as ExtraSymbolData;
        const typeChain = [];
        // eslint-disable-next-line no-bitwise
        const existingType = astTable.getSymbolType(name, { flags: SymbolTypeFlag.runtime | SymbolTypeFlag.typetime, data: data, typeChain: typeChain });

        if (!existingType || isAnyReferenceType(existingType)) {
            return;
        }
        if ((data.definingNode === node) || (isNamespaceStatement(data.definingNode) && isNamespaceStatement(node))) {
            return;
        }
        const otherNode = data.definingNode as unknown as { tokens: { name: Token }; location: Location };
        const thisNodeKindName = util.getAstNodeFriendlyName(node);
        let thatNodeKindName = util.getAstNodeFriendlyName(data.definingNode) ?? '';
        if (!thatNodeKindName && isCallableType(existingType)) {
            thatNodeKindName = 'Global Function';
        }

        let thatNameLocation = otherNode?.tokens?.name?.location ?? otherNode?.location;

        if (isNamespaceStatement(data.definingNode)) {
            thatNameLocation = data.definingNode.getNameParts()?.[0]?.location;
        }

        const relatedInformation = thatNameLocation ? [{
            message: `${thatNodeKindName} declared here`,
            location: thatNameLocation
        }] : undefined;

        diagnostics.push({
            ...messages.nameShadowing(thisNodeKindName, thatNodeKindName, name, severity),
            location: nameLocation,
            relatedInformation: relatedInformation
        });
    }

    validateTypeReassignment(file: BrsFile, assignStmt: AssignmentStatement, severity: DiagnosticSeverity, diagnostics: (BsDiagnostic)[]) {
        const functionExpression = assignStmt.findAncestor<FunctionExpression>(isFunctionExpression);
        if (!functionExpression) {
            return;
        }
        const rhsType = assignStmt.value?.getType({ flags: SymbolTypeFlag.runtime });
        if (!rhsType.isResolvable()) {
            return;
        }
        const varName = assignStmt.tokens.name.text;
        const previousType = assignStmt.getSymbolTable().getSymbolType(varName, {
            flags: SymbolTypeFlag.runtime,
            statementIndex: assignStmt.statementIndex
        });

        if (previousType?.isResolvable()) {
            // is this different?
            if (!isDynamicType(previousType)) {
                if (isDynamicType(rhsType) || !previousType.isTypeCompatible(rhsType)) {
                    diagnostics.push(
                        messages.typeReassignment(assignStmt.location, varName, previousType.toString(), rhsType.toString(), severity)
                    );
                }
            }
        }
    }

    private isLoop(node: AstNode) {
        return isForStatement(node) || isForEachStatement(node) || isWhileStatement(node);
    }

    private isCreateObject(s: CallExpression) {
        return isVariableExpression(s.callee) && s.callee.tokens?.name.text.toLowerCase() === 'createobject';
    }

    private getLiteralArgs(args: Expression[]) {
        const argsStringValue: string[] = [];
        for (const arg of args) {
            if (isLiteralExpression(arg)) {
                argsStringValue.push(arg?.tokens?.value?.text?.replace(/"/g, ''));
            } else {
                return;
            }
        }

        return argsStringValue;
    }
}

function validateForTerminatorToken(
    token: { kind: TokenKind; location: Location } | undefined,
    requireNext: boolean,
    diagnostics: (Omit<BsDiagnostic, 'file'>)[]
) {
    if (!token) {
        return;
    }
    const isNext = token.kind === TokenKind.Next;
    if (requireNext && !isNext) {
        diagnostics.push(messages.expectedNextTerminator(token.location));
    } else if (!requireNext && isNext) {
        diagnostics.push(messages.expectedEndForTerminator(token.location));
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
        const hasNL = ne.location.range.start.line > e.location.range.end.line;
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
