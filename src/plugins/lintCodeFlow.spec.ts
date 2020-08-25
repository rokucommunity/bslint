import { expect } from 'chai';
import { Linter } from '..';
import * as lintCodeFlow from './lintCodeFlow';
import { BsDiagnostic } from 'brighterscript';

function pad(n: number) {
    return n > 9 ? `${n}` : `0${n}`;
}

function fmtDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics
        .filter((d) => d.severity < 4)
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
        linter.builder.addPlugin(lintCodeFlow);
    });

    it('detects use of uninitialized vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/uninitialized-vars.brs'],
            rules: {
                'consistent-return': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `06:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `10:2001:Using uninitialised variable 'a' when this file is included in scope 'source'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements assign-all-paths', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/assign-all-paths.brs'],
            rules: {
                'assign-all-paths': 'error',
                'consistent-return': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `06:2003:Not all the code paths assign 'b'`,
            `16:2003:Not all the code paths assign 'b'`,
            `25:2003:Not all the code paths assign 'b'`,
            `42:2003:Not all the code paths assign 'b'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unsafe-path-loop', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unsafe-path-loop.brs'],
            rules: {
                'unsafe-path-loop': 'error',
                'consistent-return': 'off'
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
                'consistent-return': 'off'
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
                'consistent-return': 'off'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:2004:Unreachable code`,
            `10:2004:Unreachable code`,
            `26:2004:Unreachable code`,
            `41:2004:Unreachable code`,
            `50:2004:Unreachable code`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements consistent-return', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/consistent-return.brs'],
            rules: {
                'consistent-return': 'error',
                'optional-return': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `06:2009:This function should consistently return a value`,
            `11:2005:Function as void should not return a value`,
            `15:2009:This function should consistently return a value`,
            `18:2007:Not all code paths return a value`,
            `22:2009:This function should consistently return a value`,
            `25:2007:Not all code paths return a value`,
            `32:2007:Not all code paths return a value`
        ];
        expect(actual).deep.equal(expected);
    });
});
