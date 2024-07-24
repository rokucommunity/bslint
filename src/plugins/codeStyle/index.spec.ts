import * as fs from 'fs';
import { expect } from 'chai';
import { AALiteralExpression, AssignmentStatement, ParseMode, Parser, Program, util } from 'brighterscript';
import Linter from '../../Linter';
import CodeStyle, { collectWrappingAAMembersIndexes } from './index';
import bslintFactory, { BsLintConfig } from '../../index';
import { createContext, PluginWrapperContext } from '../../util';
import { expectDiagnostics, expectDiagnosticsFmt, fmtDiagnostics } from '../../testHelpers.spec';
import { messages } from './diagnosticMessages';

describe('codeStyle', () => {
    let linter: Linter;
    let lintContext: PluginWrapperContext;
    let program: Program;

    const project1 = {
        rootDir: 'test/project1'
    };

    /**
     * By default, all rules are off. So turn on the ones you care about for this test
     */
    function init(rules?: BsLintConfig['rules']) {
        program = new Program({
            rules: {
                'assign-all-paths': 'off',
                'unsafe-path-loop': 'off',
                'unsafe-iterators': 'off',
                'unreachable-code': 'off',
                'case-sensitivity': 'off',
                'unused-variable': 'off',
                'consistent-return': 'off',
                'no-stop': 'off',
                'inline-if-style': 'off',
                'block-if-style': 'off',
                'condition-style': 'off',
                'named-function-style': 'off',
                'anon-function-style': 'off',
                'aa-comma-style': 'off',
                'type-annotations': 'off',
                'no-print': 'off',
                'no-todo': 'off',
                'todo-pattern': 'off',
                'eol-last': 'off',
                'color-format': 'off',
                'color-case': 'off',
                'color-alpha': 'off',
                'color-alpha-defaults': 'off',
                'color-cert': 'off',
                ...(rules ?? {})
            }
        } as BsLintConfig);
        program.plugins.add(bslintFactory());
        program.plugins.emit('afterProgramCreate', program);
        return program;
    }

    beforeEach(() => {
        linter = new Linter();
        init();

        linter.builder.plugins.add({
            name: 'test',
            afterProgramCreate: (program: Program) => {
                lintContext = createContext(program);
                const codeStyle = new CodeStyle(lintContext);
                program.plugins.add(codeStyle);
            }
        });
    });

    describe('validate inline if', () => {
        it('allows anything when set to off', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/inline-if.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('disallow inline if when set to never', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/inline-if.brs'],
                rules: {
                    'inline-if-style': 'never',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `02:LINT3001:Code style: no inline if statement allowed`,
                `06:LINT3001:Code style: no inline if statement allowed`
            ];
            expect(actual).deep.equal(expected);
        });

        it('require `then` for inline if', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/inline-if.brs'],
                rules: {
                    'inline-if-style': 'then',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `06:LINT3002:Code style: add 'then' keyword`
            ];
            expect(actual).deep.equal(expected);
        });

        it('disallow `then` for inline if', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/inline-if.brs'],
                rules: {
                    'inline-if-style': 'no-then',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `02:LINT3003:Code style: remove 'then' keyword`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('validate block if', () => {

        it('allows anything when set to off', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/block-if.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('require `then` for block if', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/block-if.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'then',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `10:LINT3004:Code style: add 'then' keyword`,
                `12:LINT3004:Code style: add 'then' keyword`
            ];
            expect(actual).deep.equal(expected);
        });

        it('disallow `then` for block if', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/block-if.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'no-then',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `02:LINT3005:Code style: remove 'then' keyword`,
                `04:LINT3005:Code style: remove 'then' keyword`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('validate condition style', () => {

        it('allows anything when set to off', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/conditions.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'off',
                    'condition-style': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('requires parenthesis around conditions', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/conditions.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'off',
                    'condition-style': 'group',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `03:LINT3006:Code style: add parenthesis around condition`,
                `05:LINT3006:Code style: add parenthesis around condition`
            ];
            expect(actual).deep.equal(expected);
        });

        it('disallow parenthesis around conditions', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/conditions.brs'],
                rules: {
                    'inline-if-style': 'off',
                    'block-if-style': 'off',
                    'condition-style': 'no-group',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `12:LINT3007:Code style: remove parenthesis around condition`,
                `14:LINT3007:Code style: remove parenthesis around condition`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('validate function style', () => {
        it('enforce no-function style', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/function-style.brs'],
                rules: {
                    'named-function-style': 'no-function',
                    'anon-function-style': 'no-function',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `08:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`,
                `10:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`,
                `16:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce no-sub style', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-sub-style.brs'],
                rules: {
                    'named-function-style': 'no-sub',
                    'anon-function-style': 'no-sub',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `08:LINT3009:Code style: expected 'function' keyword (always use 'function')`,
                `10:LINT3009:Code style: expected 'function' keyword (always use 'function')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce auto style', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/auto-function-style.brs'],
                rules: {
                    'named-function-style': 'auto',
                    'anon-function-style': 'auto',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `22:LINT3009:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
                `23:LINT3009:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
                `29:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `31:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `36:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `38:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('type annotations', () => {
        it('do nothing when disabled', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/type-annotations.brs'],
                rules: {
                    'named-function-style': 'off',
                    'anon-function-style': 'off',
                    'type-annotations': 'off',
                    'no-print': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });
    });

    it('enforce return type only', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/type-annotations.brs'],
            rules: {
                'named-function-style': 'off',
                'anon-function-style': 'off',
                'type-annotations': 'return',
                'no-print': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `05:LINT3010:Strictness: function should declare the return type`
        ];
        expect(actual).deep.equal(expected);
        // should only highlight the function name
        expect(diagnostics[0].range).to.eql(
            util.createRange(4, 0, 4, 8)
        );
    });

    it('enforce arguments type only', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/type-annotations.brs'],
            rules: {
                'named-function-style': 'off',
                'anon-function-style': 'off',
                'type-annotations': 'args',
                'no-print': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `01:LINT3011:Strictness: type annotation required`,
            `05:LINT3011:Strictness: type annotation required`
        ];
        expect(actual).deep.equal(expected);
    });

    it('enforce all annotations', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/type-annotations.brs'],
            rules: {
                'named-function-style': 'off',
                'anon-function-style': 'off',
                'type-annotations': 'all',
                'no-print': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `01:LINT3011:Strictness: type annotation required`,
            `05:LINT3010:Strictness: function should declare the return type`,
            `05:LINT3011:Strictness: type annotation required`
        ];
        expect(actual).deep.equal(expected);
    });

    it('enforce no print', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/no-print.brs'],
            rules: {
                'no-print': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:LINT3012:Code style: Avoid using direct Print statements`,
            `03:LINT3012:Code style: Avoid using direct Print statements`
        ];
        expect(actual).deep.equal(expected);
    });


    describe('enforce no todo', () => {
        it('default todo pattern', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-todo.brs'],
                rules: {
                    'no-todo': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `02:LINT3015:Code style: Avoid using TODO comments`,
                `04:LINT3015:Code style: Avoid using TODO comments`,
                `06:LINT3015:Code style: Avoid using TODO comments`,
                `08:LINT3015:Code style: Avoid using TODO comments`,
                '10:LINT3015:Code style: Avoid using TODO comments',
                '12:LINT3015:Code style: Avoid using TODO comments'
            ];
            expect(actual).deep.equal(expected);
        });

        it('modified todo pattern', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-todo.brs'],
                rules: {
                    'no-todo': 'error',
                    'todo-pattern': 'PLEASEFIX'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = ['19:LINT3015:Code style: Avoid using TODO comments'];
            expect(actual).deep.equal(expected);
        });
    });
    it('enforce no stop', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/no-stop.brs'],
            // Should be warn by default
            rules: {
                'no-stop': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `03:LINT3016:Code style: STOP statements are not allowed in published applications`
        ];
        expect(actual).deep.equal(expected);
    });

    describe('enforce eol at end of file', () => {
        it('eol always', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-eol-last.brs'],
                rules: {
                    'eol-last': 'always'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `03:LINT3017:Code style: File should end with a newline`
            ];
            expect(actual).deep.equal(expected);
        });

        it('eol never', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/eol-last.brs'],
                rules: {
                    'eol-last': 'never'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `03:LINT3018:Code style: File should not end with a newline`
            ];
            expect(actual).deep.equal(expected);
        });

        it('empty file', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/empty.brs'],
                rules: {
                    'eol-last': 'always'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('off without eol', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-eol-last.brs'],
                rules: {
                    'eol-last': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('off with eol', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/eol-last.brs'],
                rules: {
                    'eol-last': 'off'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });
    });

    it('enforce no assocarray component field type', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['components/interfaceTest.xml'],
            rules: {
                'no-assocarray-component-field-type': 'info'
            }
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `06:LINT3024:Avoid using field type 'assocarray'`,
        ];
        expect(actual).deep.equal(expected);
    });

    it('enforce no array component field type', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['components/interfaceTest.xml'],
            rules: {
                'no-array-component-field-type': 'info'
            }
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:LINT3025:Avoid using field type 'array'`,
        ];
        expect(actual).deep.equal(expected);
    });

    describe('AA style', () => {
        it('collects wrapping AA members indexes', () => {
            const { statements } = Parser.parse(`
                aa = {}
                aa = {
                    p1: 1
                }
                aa = {
                    p1: 1,
                    p2: 2
                }
                aa = { 'comment
                    p1: 1,
                    'comment
                    p2: 2
                    'comment
                }
                aa = {
                    p1: 1, 'comment
                    p2: 2 'comment
                }
                aa = { p1: 1 }
                aa = { p1: 1, p2: 2 }
                aa = { p1: 1, p2: 2, }
            `, { mode: ParseMode.BrightScript }).ast;
            const indexes = statements.map(s => {
                const assign = s as AssignmentStatement;
                const value: AALiteralExpression = assign.value as AALiteralExpression;
                return collectWrappingAAMembersIndexes(value);
            });
            expect(indexes).to.deep.equal([
                [],
                [0],
                [0, 1],
                [1, 3],
                [0, 2],
                [0],
                [1],
                [1]
            ]);
        });

        it('enforce aa comma, never', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style.brs'],
                rules: {
                    'aa-comma-style': 'never'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `03:LINT3013:Remove optional comma`,
                `04:LINT3013:Remove optional comma`,
                `11:LINT3013:Remove optional comma`,
                `12:LINT3013:Remove optional comma`,
                `13:LINT3013:Remove optional comma`,
                `31:LINT3013:Remove optional comma`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce aa comma, no dangling', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style.brs'],
                rules: {
                    'aa-comma-style': 'no-dangling'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `13:LINT3013:Remove optional comma`,
                `19:LINT3014:Add comma after the expression`,
                `20:LINT3014:Add comma after the expression`,
                `31:LINT3013:Remove optional comma`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce aa comma, always', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style.brs'],
                rules: {
                    'aa-comma-style': 'always'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `05:LINT3014:Add comma after the expression`,
                `19:LINT3014:Add comma after the expression`,
                `20:LINT3014:Add comma after the expression`,
                `21:LINT3014:Add comma after the expression`,
                `31:LINT3013:Remove optional comma`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('color-format', () => {
        it('finds colors in various templateString expression styles', () => {
            /* eslint-disable no-template-curly-in-string */

            doTest('print `0xffffff`', [7, 15]); // string-like
            doTest('print `${"0xffffff"}`', [9, 19]); // expression with a string in it
            doTest('print `0xffffff${"0xffffff"}`', [17, 27]); // color then expression
            doTest('print `${"0xffffff"}0xffffff`', [9, 19]); // expression then color
            doTest('print `${"0xffffff"}0xffffff${"0xffffff"}`', [9, 19], [30, 40]); // expression then color then expression
            doTest('print `0xffffff${"0xffffff"}0xffffff`', [17, 27]); // color then expression then color

            function doTest(code: string, ...diagnosticCharLocations: Array<[startChar: number, endChar: number]>) {
                init({
                    'color-format': 'quoted-numeric-hex',
                    'color-case': 'upper'
                });
                program.setFile(
                    'source/main.bs',
                    `sub init()\n${code}\nend sub`
                );
                program.validate();
                expectDiagnostics(
                    program,
                    diagnosticCharLocations.map(x => messages.expectedColorCase(util.createRange(1, x[0], 1, x[1])))
                );
            }
            /* eslint-enable no-template-curly-in-string */
        });

        it('quoted-numeric-hex & uppercase', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-case': 'upper'
            });
            program.setFile('source/main.brs', `
                sub init()
                    colors = ["0xff0000", "0x00FF00"]
                    nonValidColorsWrongColorFormat = [
                        "#xxffff" ' this string is skipped because xx is not valid hex
                    ]
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '03:LINT3020:Code style: File should follow color case'
            ]);
        });

        it('hash-hex & lowercase', () => {
            init({
                'color-format': 'hash-hex',
                'color-case': 'lower'
            });
            program.setFile('source/main.brs', `
                sub init()
                    colors = {
                        value1: "#0000ff",
                        value2: "#00FFff",
                        value3: "#ff0000",
                        shortFormColorHash: "#f0F"
                    }
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '05:LINT3020:Code style: File should follow color case'
            ]);
        });

        it('has-hex & lowercase & template strings', () => {
            init({
                'color-format': 'hash-hex',
                'color-case': 'lower'
            });
            program.setFile('source/main.bs', `
                sub init()
                    colors = {
                        value1: \`#00FFff\`,
                        value2: \`#0000ff\`,
                        value3: \`#ff0000\`,
                        value4: \`#ff00FF\`,
                        shortFormColorHash: \`#f0F\`
                    }
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '04:LINT3020:Code style: File should follow color case',
                '07:LINT3020:Code style: File should follow color case'
            ]);
        });

        it('BRS file color format is none - no color values found', () => {
            init({
                'color-format': 'never'
            });
            program.setFile('source/main.bs', `
                sub init()
                    colorLengthStringNoColorValues = "abcdefg"
                    colorLengthStringInvalidColorValues = "0xxx0000"
                    shortFormColorHash = "#f00"
                    shortFormColorQuoteNumeric = "0xf00"

                    colorLengthStringNoColorValues = \`abcdefg\`
                    colorLengthStringInvalidColorValues = \`0xxx0000\`
                    shortFormColorHash = \`#f00\`
                    shortFormColorQuoteNumeric = \`0xf00\`
                end sub
            `);
            expectDiagnosticsFmt(program, []);
        });

        it('color-format:never but color values found', () => {
            init({
                'color-format': 'never'
            });
            program.setFile('source/main.bs', `
                sub init()
                    colors = {
                        value1: "#0000ff",
                        value2: "#00FFff",
                        value3: "#ff0000",
                        shortFormColorHash: "#f0F"
                    }
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '04:LINT3019:Code style: File should follow color format',
                '05:LINT3019:Code style: File should follow color format',
                '06:LINT3019:Code style: File should follow color format'
            ]);
        });

        it('quoted-numeric-hex & color-cert:always', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-cert': 'always'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xEBEBEC"
                    color = "0x161616"
                    color = "0xEBEBEBFF"
                    color = "0x161615"
                    longStringWithColors = "Long string value with 0x161615 non broadcast safe color values defined"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '03:LINT3023:Code style: File should follow Roku broadcast safe color cert requirement',
                '06:LINT3023:Code style: File should follow Roku broadcast safe color cert requirement'
            ]);
        });

        it('quoted-numeric-hex & color-cert:off', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-cert': 'off'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xDBDBDC"
                    color = "0x161616"
                    color = "0xEBEBEBFF"
                    color = "0x161615"
                    longStringWithColors = "Long string value with 0x161615 non broadcast safe color values defined"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, []);
        });

        it('quoted-numeric-hex, color-alpha:allowed, color-alpha-defaults:never', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-alpha': 'allowed',
                'color-alpha-defaults': 'never'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xf00000"
                    color = "0xff0000cc"
                    color = "0xfff000"
                    color = "0xffff0000"
                    color = "0xfffff0FF"
                    colorLengthStringNoColorValues = "abcdefg"
                    colorLengthStringInvalidColorValues = "0xxx0000"
                    shortFormColorHash = "#f00"
                    shortFormColorQuoteNumeric = "0xf00"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '06:LINT3022:Code style: File should follow color alpha defaults rule',
                '07:LINT3022:Code style: File should follow color alpha defaults rule'
            ]);
        });

        it('quoted-numeric-hex, alpha values are allowed and only hidden alpha (00) defaults are allowed', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-alpha': 'allowed',
                'color-alpha-defaults': 'only-hidden'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xf00000"
                    color = "0xff0000cc"
                    color = "0xfff000"
                    color = "0xffff0000"
                    color = "0xfffff0FF"
                    colorLengthStringNoColorValues = "abcdefg"
                    colorLengthStringInvalidColorValues = "0xxx0000"
                    shortFormColorHash = "#f00"
                    shortFormColorQuoteNumeric = "0xf00"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '07:LINT3022:Code style: File should follow color alpha defaults rule'
            ]);
        });

        it('quoted-numeric-hex and alpha values are not allowed', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-alpha': 'never'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xf00000"
                    color = "0xff0000cc"
                    color = "0xfff000"
                    color = "0xffff0000"
                    color = "0xfffff0FF"
                    colorLengthStringNoColorValues = "abcdefg"
                    colorLengthStringInvalidColorValues = "0xxx0000"
                    shortFormColorHash = "#f00"
                    shortFormColorQuoteNumeric = "0xf00"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '04:LINT3021:Code style: File should follow color alpha rule',
                '06:LINT3021:Code style: File should follow color alpha rule',
                '07:LINT3021:Code style: File should follow color alpha rule'
            ]);
        });

        it('quoted-numeric-hex and alpha values are required', () => {
            init({
                'color-format': 'quoted-numeric-hex',
                'color-alpha': 'always'
            });
            program.setFile('source/main.bs', `
                sub init()
                    color = "0xf00000"
                    color = "0xff0000cc"
                    color = "0xfff000"
                    color = "0xffff0000"
                    color = "0xfffff0FF"
                    colorLengthStringNoColorValues = "abcdefg"
                    colorLengthStringInvalidColorValues = "0xxx0000"
                    shortFormColorHash = "#f00"
                    shortFormColorQuoteNumeric = "0xf00"
                end sub
            `);
            program.validate();
            expectDiagnosticsFmt(program, [
                '03:LINT3021:Code style: File should follow color alpha rule',
                '05:LINT3021:Code style: File should follow color alpha rule'
            ]);
        });
    });

    describe('fix', () => {
        // Filenames (without the extension) that we want to copy with a "-temp" suffix
        const tmpFileNames = [
            'function-style',
            'if-style',
            'aa-style',
            'eol-last',
            'no-eol-last',
            'single-line'
        ];

        beforeEach(() => {
            tmpFileNames.forEach(filename => fs.copyFileSync(
                `${project1.rootDir}/source/${filename}.brs`,
                `${project1.rootDir}/source/${filename}-temp.brs`
            ));
        });

        afterEach(() => {
            // Clear temp files
            tmpFileNames.forEach(filename => fs.unlinkSync(
                `${project1.rootDir}/source/${filename}-temp.brs`
            ));
        });

        it('replaces `sub` with `function`', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/function-style-temp.brs'],
                rules: {
                    'named-function-style': 'no-function',
                    'anon-function-style': 'no-function',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/function-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/function-style-nofun.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('replaces `function` with `sub`', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/function-style-temp.brs'],
                rules: {
                    'named-function-style': 'no-sub',
                    'anon-function-style': 'no-sub',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/function-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/function-style-nosub.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('removes optional `then`', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/if-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'block-if-style': 'no-then',
                    'inline-if-style': 'no-then',
                    'condition-style': 'off',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-nothen.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('adds optional `then`', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/if-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'block-if-style': 'then',
                    'inline-if-style': 'then',
                    'condition-style': 'off',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-then.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('remove optional condition group', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/if-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'block-if-style': 'off',
                    'inline-if-style': 'off',
                    'condition-style': 'no-group',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-nogroup.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('add optional condition group', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/if-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'block-if-style': 'off',
                    'inline-if-style': 'off',
                    'condition-style': 'group',
                    'no-print': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/if-style-group.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('remove optional aa comma', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'anon-function-style': 'off',
                    'no-print': 'off',
                    'aa-comma-style': 'never'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-nocomma.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('add missing aa comma, always', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'anon-function-style': 'off',
                    'no-print': 'off',
                    'aa-comma-style': 'always'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-always.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('add missing aa comma, no dangling', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/aa-style-temp.brs'],
                rules: {
                    'named-function-style': 'off',
                    'anon-function-style': 'off',
                    'no-print': 'off',
                    'aa-comma-style': 'no-dangling'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/aa-style-nodangling.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('adds eol last', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-eol-last-temp.brs'],
                rules: {
                    'eol-last': 'always'
                },
                fix: true
            });

            const actual = fmtDiagnostics(diagnostics);
            const expected = [];

            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/no-eol-last-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/eol-last.brs`).toString();

            expect(actualSrc).to.equal(expectedSrc);
        });

        it('adds eol last to single line file', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/single-line-temp.brs'],
                rules: {
                    'eol-last': 'always'
                },
                fix: true
            });

            const actual = fmtDiagnostics(diagnostics);
            const expected = [];

            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/single-line-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/single-line-eol.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });

        it('removes eol last', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/eol-last-temp.brs'],
                rules: {
                    'eol-last': 'never'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/eol-last-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/no-eol-last.brs`).toString();
            expect(actualSrc).to.equal(expectedSrc);
        });
    });
});
