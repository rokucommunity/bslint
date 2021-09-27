import * as fs from 'fs';
import { expect } from 'chai';
import { AALiteralExpression, AssignmentStatement, BsDiagnostic, ParseMode, Parser, Program } from 'brighterscript';
import Linter from '../../Linter';
import CodeStyle, { collectWrappingAAMembersIndexes } from './index';
import { createContext, PluginWrapperContext } from '../../util';

function pad(n: number) {
    return n > 9 ? `${n}` : `0${n}`;
}

function fmtDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics
        .filter((d) => d.severity && d.severity < 4)
        .sort((a, b) => a.range.start.line - b.range.start.line)
        .map((d) => `${pad(d.range.start.line + 1)}:${d.code}:${d.message}`);
}

describe('codeStyle', () => {
    let linter: Linter;
    let lintContext: PluginWrapperContext;

    const project1 = {
        rootDir: 'test/project1'
    };

    beforeEach(() => {
        linter = new Linter();
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
                `27:LINT3014:Add comma after the expression`
            ];
            expect(actual).deep.equal(expected);
        });
    });

    describe('fix', () => {
        beforeEach(() => {
            fs.copyFileSync(
                `${project1.rootDir}/source/function-style.brs`,
                `${project1.rootDir}/source/function-style-temp.brs`
            );
            fs.copyFileSync(
                `${project1.rootDir}/source/if-style.brs`,
                `${project1.rootDir}/source/if-style-temp.brs`
            );
            fs.copyFileSync(
                `${project1.rootDir}/source/aa-style.brs`,
                `${project1.rootDir}/source/aa-style-temp.brs`
            );
        });

        afterEach(() => {
            fs.unlinkSync(`${project1.rootDir}/source/function-style-temp.brs`);
            fs.unlinkSync(`${project1.rootDir}/source/if-style-temp.brs`);
            fs.unlinkSync(`${project1.rootDir}/source/aa-style-temp.brs`);
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
    });
});
