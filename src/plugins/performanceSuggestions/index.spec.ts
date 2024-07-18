import { expect } from 'chai';
import { Program } from 'brighterscript';
import Linter from '../../Linter';
import CodePerformance from './index';
import bslintFactory from '../../index';
import { createContext, PluginWrapperContext } from '../../util';
import { fmtDiagnostics } from '../../testHelpers.spec';


describe('performanceSuggestions', () => {
    let linter: Linter;
    let lintContext: PluginWrapperContext;
    let program: Program;
    const project1 = {
        rootDir: 'test/project1'
    };

    beforeEach(() => {
        linter = new Linter();
        program = new Program({});
        program.plugins.add(bslintFactory());
        program.plugins.emit('afterProgramCreate', program);
        linter.builder.plugins.add({
            name: 'test',
            afterProgramCreate: (program: Program) => {
                lintContext = createContext(program);
                const performance = new CodePerformance(lintContext);
                program.plugins.add(performance);
            }
        });
    });

    it('mark inefficient interface types', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['components/interfaceTest.xml']
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:LINT5001:Using array type in component markup can result in inefficient copying of data during transfer to the render thread. Use ‘node’ type if possible for more efficient transfer of data from the task thread to the render thread`,
        ];
        expect(actual).deep.equal(expected);
    });
});
