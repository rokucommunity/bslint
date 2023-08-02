import { expect } from 'chai';
import { BsDiagnostic, Program } from 'brighterscript';
import Linter from '../../Linter';
import { createContext, PluginWrapperContext } from '../../util';
import CheckUsage from './index';

function pad(n: number) {
    return n > 9 ? `${n}` : `0${n}`;
}

function fmtDiagnostics(diagnostics: BsDiagnostic[]) {
    return diagnostics
        .filter((d) => d.severity && d.severity < 4)
        .sort((a, b) => a.range.start.line - b.range.start.line)
        .map((d) => `${pad(d.range.start.line + 1)}:${d.code}:${d.message}`.replace('\\', '/')); // Win to nix path
}

describe('checkUsage', () => {
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
                const checkUsage = new CheckUsage(lintContext);
                program.plugins.add(checkUsage);
            }
        });
    });

    it('detects component refered by name in main.brs', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: [
                'source/main.brs',
                'components/parent.brs', 'components/parent.xml'
            ],
            rules: {
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [];
        expect(actual).deep.equal(expected);
    });

    it('detects component refered as child', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: [
                'source/main.brs',
                'components/parent.brs', 'components/parent.xml',
                'components/child1.brs', 'components/child1.xml',
                'components/child2.brs', 'components/child2.xml'
            ],
            rules: {
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        // debugger;
        const expected = [
            `01:LINT4002:Script 'components/child2.brs' does not seem to be used`,
            `02:LINT4001:Component 'components/child2.xml' does not seem to be used`
        ];
        expect(actual).deep.equal(expected);
    });
});
