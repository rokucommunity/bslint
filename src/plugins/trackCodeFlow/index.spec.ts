import { expect } from 'chai';
import { BsDiagnostic } from 'brighterscript';
import Linter from '../../Linter';
import trackCodeFlow from '.';

function pad(n: number) {
    return n > 9 ? `${n}` : `0${n}`;
}

function fmtDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics
        .filter((d) => d.severity && d.severity < 4)
        .sort((a, b) => a.range.start.line - b.range.start.line)
        .map((d) => `${pad(d.range.start.line + 1)}:${d.code}:${d.message}`);
}

describe('lintCodeFlow', () => {
    let linter: Linter;
    const project1 = {
        rootDir: 'test/project1'
    };

    beforeEach(() => {
        linter = new Linter();
        linter.builder.plugins.add(trackCodeFlow);
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
            `02:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `06:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `10:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `16:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`
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
            `06:2003:Not all the code paths assign 'b'`,
            `16:2003:Not all the code paths assign 'b'`,
            `25:2003:Not all the code paths assign 'b'`,
            `42:2003:Not all the code paths assign 'b'`,
            `51:2003:Not all the code paths assign 'b'`,
            `62:2003:Not all the code paths assign 'b'`,
            `71:2003:Not all the code paths assign 'b'`,
            `83:2003:Not all the code paths assign 'b'`,
            `85:2003:Not all the code paths assign 'b'`
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
            `10:2003:Not all the code paths assign 'b'`,
            `19:2003:Not all the code paths assign 'b'`
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
        const expected = [`05:2003:Not all the code paths assign 'a'`, `15:2003:Not all the code paths assign 'b'`];
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
            `05:2002:Using iterator variable 'i' outside loop`,
            `14:2002:Using iterator variable 'a' outside loop`
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
            `04:2011:Unreachable code`,
            `10:2011:Unreachable code`,
            `26:2011:Unreachable code`,
            `41:2011:Unreachable code`,
            `50:2011:Unreachable code`
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
            `03:2004:Variable 'A' was previously set with a different casing as 'a'`,
            `04:2004:Variable 'A' was previously set with a different casing as 'a'`,
            `05:2004:Variable 'A' was previously set with a different casing as 'a'`,
            `06:2004:Variable 'A' was previously set with a different casing as 'a'`,
            `11:2004:Variable 'A' was previously set with a different casing as 'a'`,
            `15:2004:Variable 'a' was previously set with a different casing as 'A'`
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
            `04:2012:Sub as void should not return a value`,
            `11:2012:Function as void should not return a value`,
            `15:2016:Sub should consistently return a value`,
            `18:2014:Not all code paths return a value`,
            `22:2016:Function should consistently return a value`,
            `25:2014:Not all code paths return a value`,
            `32:2014:Not all code paths return a value`,
            `39:2014:Not all code paths return a value`,
            `45:2014:Not all code paths return a value`
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
            `02:2005:Variable 'a' is set but value is never used`,
            `08:2005:Variable 'a' is set but value is never used`
        ];
        expect(actual).deep.equal(expected);
    });
});
