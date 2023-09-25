import { Program } from 'brighterscript';
import * as path from 'path';
import Linter from '../../Linter';
import { createContext, PluginWrapperContext } from '../../util';
import CheckUsage from './index';
import { expectDiagnosticsFmt } from '../../testHelpers.spec';

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
        expectDiagnosticsFmt(diagnostics, []);
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
        expectDiagnosticsFmt(diagnostics, [
            `01:LINT4002:Script 'components${path.sep}child2.brs' does not seem to be used`,
            `02:LINT4001:Component 'components${path.sep}child2.xml' does not seem to be used`
        ]);
    });
});
