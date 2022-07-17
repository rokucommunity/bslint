import * as fs from 'fs';
import { expect } from 'chai';
import { BsDiagnostic, Program } from 'brighterscript';
import Linter from '../../Linter';
import TrackCodeFlow from './index';
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

describe('trackCodeFlow', () => {
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
                const trackCodeFlow = new TrackCodeFlow(lintContext);
                program.plugins.add(trackCodeFlow);
            }
        });
    });

    it('detects use of uninitialized vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/uninitialized-vars.brs'],
            rules: {
                'consistent-return': 'off',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `06:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `10:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `16:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`
        ];
        expect(actual).deep.equal(expected);
    });

    describe('does not mark enums as uninitialised vars', () => {
        it('in a regular file', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/enums.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });
        it('inside a class', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/enum-in-class.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });
        it('inside a namespace', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/enum-in-namespace.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });
    });

    it('implements assign-all-paths', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/assign-all-paths.brs'],
            rules: {
                'assign-all-paths': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `06:LINT1003:Not all the code paths assign 'b'`,
            `16:LINT1003:Not all the code paths assign 'b'`,
            `25:LINT1003:Not all the code paths assign 'b'`,
            `42:LINT1003:Not all the code paths assign 'b'`,
            `51:LINT1003:Not all the code paths assign 'b'`,
            `62:LINT1003:Not all the code paths assign 'b'`,
            `71:LINT1003:Not all the code paths assign 'b'`,
            `83:LINT1003:Not all the code paths assign 'b'`,
            `85:LINT1003:Not all the code paths assign 'b'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('report errors for classes', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/class-methods.bs'],
            rules: {
                'assign-all-paths': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `18:LINT1003:Not all the code paths assign 'b'`,
            `27:LINT1003:Not all the code paths assign 'b'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unsafe-path-loop', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unsafe-path-loop.brs'],
            rules: {
                'unsafe-path-loop': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `05:LINT1003:Not all the code paths assign 'a'`,
            `15:LINT1003:Not all the code paths assign 'b'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unsafe-iterators', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unsafe-iterators.brs'],
            rules: {
                'unsafe-iterators': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `05:LINT1002:Using iterator variable 'i' outside loop`,
            `14:LINT1002:Using iterator variable 'a' outside loop`
        ];
        expect(actual).deep.equal(expected);
    });

    it('supports catch error variable within catch branch', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/catch-statement.brs'],
            rules: {
                'consistent-return': 'off',
                'assign-all-paths': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:LINT1001:Using uninitialised variable 'err' when this file is included in scope 'source'`,
            `08:LINT1001:Using uninitialised variable 'err' when this file is included in scope 'source'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unreachable-code', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unreachable-code.brs'],
            rules: {
                'unreachable-code': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:LINT2001:Unreachable code`,
            `10:LINT2001:Unreachable code`,
            `26:LINT2001:Unreachable code`,
            `41:LINT2001:Unreachable code`,
            `50:LINT2001:Unreachable code`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements case-sensitivity', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/case-sensitivity.brs'],
            rules: {
                'case-sensitivity': 'error',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `03:LINT1004:Variable 'A' was previously set with a different casing as 'a'`,
            `04:LINT1004:Variable 'A' was previously set with a different casing as 'a'`,
            `05:LINT1004:Variable 'A' was previously set with a different casing as 'a'`,
            `06:LINT1004:Variable 'A' was previously set with a different casing as 'a'`,
            `11:LINT1004:Variable 'A' was previously set with a different casing as 'a'`,
            `15:LINT1004:Variable 'a' was previously set with a different casing as 'A'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements consistent-return', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/consistent-return.brs'],
            rules: {
                'consistent-return': 'error',
                'unused-variable': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:LINT2002:Sub as void should not return a value`,
            `11:LINT2002:Function as void should not return a value`,
            `15:LINT2006:Sub should consistently return a value`,
            `18:LINT2004:Not all code paths return a value`,
            `22:LINT2006:Function should consistently return a value`,
            `25:LINT2004:Not all code paths return a value`,
            `32:LINT2004:Not all code paths return a value`,
            `39:LINT2004:Not all code paths return a value`,
            `45:LINT2004:Not all code paths return a value`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unused-variable', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unused-variable.brs'],
            rules: {
                'unused-variable': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:LINT1005:Variable 'a' is set but value is never used`,
            `08:LINT1005:Variable 'a' is set but value is never used`,
            `12:LINT1005:Variable 'a' is set but value is never used`,
            `21:LINT1005:Variable 'd' is set but value is never used`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements globals', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/uninitialized-vars.brs'],
            rules: {
                'unused-variable': 'error'
            },
            globals: ['a'],
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `14:LINT1005:Variable 'a' is set but value is never used`
        ];
        expect(actual).deep.equal(expected);
    });

    describe('fix', () => {
        beforeEach(() => {
            fs.copyFileSync(
                `${project1.rootDir}/source/case-sensitivity.brs`,
                `${project1.rootDir}/source/case-sensitivity-temp.brs`
            );
        });

        afterEach(() => {
            fs.unlinkSync(`${project1.rootDir}/source/case-sensitivity-temp.brs`);
        });

        it('fixes inconsistent case', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/case-sensitivity-temp.brs'],
                rules: {
                    'case-sensitivity': 'error'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `11:LINT1005:Variable 'A' is set but value is never used`
            ];
            expect(actual).deep.equal(expected);

            expect(lintContext.pendingFixes.size).equals(1);
            await lintContext.applyFixes();
            expect(lintContext.pendingFixes.size).equals(0);

            const actualSrc = fs.readFileSync(`${project1.rootDir}/source/case-sensitivity-temp.brs`).toString();
            const expectedSrc = fs.readFileSync(`${project1.rootDir}/source/case-sensitivity-fixed.brs`).toString();
            expect(
                actualSrc.replace(/\r?\n/g, '\n')
            ).to.equal(
                expectedSrc.replace(/\r?\n/g, '\n')
            );
        });
    });
});
