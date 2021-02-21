import { expect } from 'chai';
import { BrsFile, BsDiagnostic, Program } from 'brighterscript';
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
        it('enforce no-function style', () => {
            const file = new BrsFile('/path/to/source/temp.brs', 'pkg://source/temp.brs', new Program({}));
            file.parse(`
                sub ok()
                    print "ok"
                    exec(sub()
                        print "ok"
                    end sub)
                end sub
                function error()
                    print "ko"
                    exec(function()
                        print "ko"
                    end function)
                end function
                sub exec(x)
                end sub
            `);
            const codeStyle = new CodeStyle(new Program({
                rules: {
                    'named-function-style': 'no-function',
                    'anon-function-style': 'no-function'
                }
            } as any));

            for (const fun of file.parser.references.functionExpressions) {
                codeStyle.validateFunctionStyle(file, fun);
            }
            const actual = fmtDiagnostics(file.getDiagnostics());
            const expected = [
                `08:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`,
                `10:LINT3008:Code style: expected 'sub' keyword (always use 'sub')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce no-sub style', () => {
            const file = new BrsFile('/path/to/source/temp.brs', 'pkg://source/temp.brs', new Program({}));
            file.parse(`
                function ok()
                    print "ok"
                    exec(function()
                        print "ok"
                    end function)
                end function
                sub error()
                    print "ko"
                    exec(sub()
                        print "ko"
                    end sub)
                end sub
                function exec(x)
                end function
            `);
            const codeStyle = new CodeStyle(new Program({
                rules: {
                    'named-function-style': 'no-sub',
                    'anon-function-style': 'no-sub'
                }
            } as any));

            for (const fun of file.parser.references.functionExpressions) {
                codeStyle.validateFunctionStyle(file, fun);
            }
            const actual = fmtDiagnostics(file.getDiagnostics());
            const expected = [
                `08:LINT3008:Code style: expected 'function' keyword (always use 'function')`,
                `10:LINT3008:Code style: expected 'function' keyword (always use 'function')`
            ];
            expect(actual).deep.equal(expected);
        });

        it('enforce auto style', () => {
            const file = new BrsFile('/path/to/source/temp.brs', 'pkg://source/temp.brs', new Program({}));
            file.parse(`
                sub ok1()
                    print "ok"
                    exec(sub()
                        print "ok"
                    end sub)
                end sub
                function ok2()
                    exec(function()
                        return "ok"
                    end function)
                    return "ok"
                end function
                function ok3() as String
                    exec(function() as String
                        return "ok"
                    end function)
                    return "ok"
                end function
                sub error1() '20
                    exec(sub()
                        return "ko"
                    end sub)
                    return "ko"
                end sub
                function error2()
                    print "ko"
                    exec(function()
                        print "ko"
                    end function)
                end function
                function error3() as void
                    print "ko"
                    exec(function() as void
                        print "ko"
                    end function)
                end function
                sub exec(x)
                end sub
            `);
            const codeStyle = new CodeStyle(new Program({
                rules: {
                    'named-function-style': 'auto',
                    'anon-function-style': 'auto'
                }
            } as any));

            for (const fun of file.parser.references.functionExpressions) {
                codeStyle.validateFunctionStyle(file, fun);
            }
            const actual = fmtDiagnostics(file.getDiagnostics());
            const expected = [
                `20:LINT3008:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
                `21:LINT3008:Code style: expected 'function' keyword (use 'function' when a value is returned)`,
                `26:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `28:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `32:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`,
                `34:LINT3008:Code style: expected 'sub' keyword (use 'sub' when no value is returned)`
            ];
            expect(actual).deep.equal(expected);
        });
    });
});
