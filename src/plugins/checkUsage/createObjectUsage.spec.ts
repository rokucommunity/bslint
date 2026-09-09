import { AfterProvideProgramEvent } from 'brighterscript';
import * as path from 'path';
import Linter from '../../Linter';
import { expectDiagnostics } from '../../testHelpers.spec';
import { createContext } from '../../util';
import CheckUsage, { UnusedCode } from './index';

describe('checkUsage CreateObject usage', () => {
    it('counts only roSGNode usage without crashing on incomplete CreateObject calls', async () => {
        const linter = new Linter();
        linter.builder.plugins.add({
            name: 'test',
            afterProvideProgram: (event: AfterProvideProgramEvent) => {
                const program = event.program;
                program.setFile('source/main.brs', `
                    sub main()
                        emptyObject = CreateObject()
                        regex = CreateObject("roRegex")
                        invalidNode = CreateObject("Parent")
                        validNode = CreateObject("roSGNode", "Used")
                        print "Unrelated"
                    end sub
                `);

                for (const name of ['Parent', 'Used', 'Unrelated']) {
                    program.setFile(`components/${name.toLowerCase()}.brs`, 'sub init()\nend sub');
                    program.setFile(`components/${name.toLowerCase()}.xml`, `
                        <component name="${name}" extends="Group">
                            <script uri="pkg:/components/${name.toLowerCase()}.brs" />
                        </component>
                    `);
                }

                program.plugins.add(new CheckUsage(createContext(program)));
            }
        });

        const diagnostics = await linter.run({
            rootDir: 'test/project1',
            files: [],
            rules: {},
            diagnosticFilters: [
                'incorrect-argument-count',
                'incorrect-createobject-argument-count',
                'unknown-brightscript-component'
            ]
        } as any);

        expectDiagnostics(diagnostics, [
            {
                code: UnusedCode.UnusedComponent,
                message: `Component 'components${path.sep}parent.xml' does not seem to be used`
            },
            {
                code: UnusedCode.UnusedComponent,
                message: `Component 'components${path.sep}unrelated.xml' does not seem to be used`
            },
            {
                code: UnusedCode.UnusedScript,
                message: `Script 'components${path.sep}parent.brs' does not seem to be used`
            },
            {
                code: UnusedCode.UnusedScript,
                message: `Script 'components${path.sep}unrelated.brs' does not seem to be used`
            }
        ]);
    });
});
