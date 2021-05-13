import { expect } from 'chai';
import { BsDiagnostic, Program } from 'brighterscript';
import Linter from '../../Linter';
import TrackCodeFlow from './index';

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
    const project1 = {
        rootDir: 'test/project1'
    };

    beforeEach(() => {
        linter = new Linter();
        linter.builder.plugins.add({
            name: 'test',
            afterProgramCreate: (program: Program) => {
                const trackCodeFlow = new TrackCodeFlow(program);
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
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `06:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `10:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `16:LINT1001:Using uninitialised variable 'a' when this file is included in scope 'source'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements assign-all-paths', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/assign-all-paths.brs'],
            rules: {
                'assign-all-paths': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            }
        });
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
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `10:LINT1003:Not all the code paths assign 'b'`,
            `19:LINT1003:Not all the code paths assign 'b'`,
            `59:1029:Class 'Bar' could not be found when this file is included in scope 'source'`
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
            }
        });
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
            `08:LINT1005:Variable 'a' is set but value is never used`
        ];
        expect(actual).deep.equal(expected);
    });
});
