import { expect } from 'chai';
import { BsDiagnostic, Program } from 'brighterscript';
import Linter from '../../Linter';
import CodeStyle from './index';

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

    const project1 = {
        rootDir: 'test/project1'
    };

    beforeEach(() => {
        linter = new Linter();
        linter.builder.plugins.add({
            name: 'test',
            afterProgramCreate: (program: Program) => {
                const codeStyle = new CodeStyle(program);
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'off'
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
                    'condition-style': 'group'
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
                    'condition-style': 'no-group'
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
                files: ['source/no-function-style.brs'],
                rules: {
                    'named-function-style': 'no-function',
                    'anon-function-style': 'no-function'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `08:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`,
                `10:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce no-sub style', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/no-sub-style.brs'],
                rules: {
                    'named-function-style': 'no-sub',
                    'anon-function-style': 'no-sub'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `08:LINT3008:Code style: expected 'function' keyword (always use 'function')`,
                `10:LINT3008:Code style: expected 'function' keyword (always use 'function')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce auto style', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/auto-function-style.brs'],
                rules: {
                    'named-function-style': 'auto',
                    'anon-function-style': 'auto'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `22:LINT3008:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
                `23:LINT3008:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
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
                    'type-annotations': 'off'
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
                'type-annotations': 'return'
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
                'type-annotations': 'args'
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
                'type-annotations': 'all'
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
});
