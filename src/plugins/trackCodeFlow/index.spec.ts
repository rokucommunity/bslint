import * as fs from 'fs';
import { expect } from 'chai';
import { AfterProvideProgramEvent, Program, util } from 'brighterscript';
import Linter from '../../Linter';
import TrackCodeFlow from './index';
import bslintFactory from '../../index';
import { createContext, PluginWrapperContext } from '../../util';
import { expectDiagnostics, fmtDiagnostics } from '../../testHelpers.spec';
import { VarLintError } from './varTracking';
import * as path from 'path';

describe('trackCodeFlow', () => {
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
        program.plugins.emit('afterProvideProgram', { builder: undefined, program: program });

        linter.builder.plugins.add({
            name: 'test',
            afterProvideProgram: (event: AfterProvideProgramEvent) => {
                const { program } = event;
                lintContext = createContext(program);
                const trackCodeFlow = new TrackCodeFlow(lintContext);
                program.plugins.add(trackCodeFlow);
            }
        });
    });

    it('properly tracks code flow between try/catch', () => {
        program.setFile('source/main.brs', `
            sub main()
                try
                    text1 = "a"
                    text2 = "b"
                catch e
                    text1 = "c"
                end try
                print text1
                print text2
            end sub
        `);
        program.validate();

        expectDiagnostics(program, [{
            code: VarLintError.UnsafeInitialization,
            message: `Not all the code paths assign 'text2'`,
            location: {
                range: util.createRange(9, 22, 9, 27)
            }
        }]);
    });

    it('detects use of uninitialized vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/uninitialized-vars.brs'],
            rules: {
                'consistent-return': 'off',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001, 1141]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `02:uninitialized-variable:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `06:uninitialized-variable:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `10:uninitialized-variable:Using uninitialised variable 'a' when this file is included in scope 'source'`,
            `16:uninitialized-variable:Using uninitialised variable 'a' when this file is included in scope 'source'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('does not mark consts as uninitialised vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/const.bs'],
            rules: {
                'unused-variable': 'error'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [];
        expect(actual).deep.equal(expected);
    });

    it('does not mark inline anonymous functions param types as uninitialised vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/inline-functions.bs'],
            rules: {
                'unused-variable': 'error'
            },
            diagnosticFilters: []
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [];
        expect(actual).deep.equal(expected);
    });

    it('does not mark typecasts as uninitialised vars', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/typecast-expressions.bs'],
            rules: {
                'unused-variable': 'error'
            },
            diagnosticFilters: []
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [];
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
            const expected = [
                '04:invalid-declaration-location:enum must be declared at the root level or within a namespace'
            ];
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

    describe('removes uninitialized var diagnostics after dependent code updates', () => {
        it('after fixing uninitialized var', () => {
            program.setFile('components/Comp.xml', `<?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script uri="Comp.bs"/>
                </component>
            `);
            program.setFile('components/Comp.bs', `
                import "pkg:/source/common.bs"

                sub init()
                    print doThing()
                end sub
            `);

            program.setFile('components/Comp2.xml', `<?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp2" extends="Group">
                    <script uri="Comp2.bs"/>
                </component>
            `);
            program.setFile('components/Comp2.bs', `
                import "pkg:/source/common.bs"

                sub init()
                    print doThing()
                end sub
            `);

            program.setFile('source/common.bs', `
                function doOtherThing() as string
                    return "hello"
                end function
            `);
            program.validate();
            const actual = fmtDiagnostics(program.getDiagnostics());
            const expected = [
                `05:cannot-find-function:Cannot find function 'doThing'`,
                `05:cannot-find-function:Cannot find function 'doThing'`,
                `05:uninitialized-variable:Using uninitialised variable 'doThing' when this file is included in scope 'components${path.sep}Comp.xml'`,
                `05:uninitialized-variable:Using uninitialised variable 'doThing' when this file is included in scope 'components${path.sep}Comp2.xml'`
            ];
            expect(actual).deep.equal(expected);

            program.setFile('source/common.bs', `
                function doThing() as string
                    return "hello"
                end function
            `);
            program.validate();
            expectDiagnostics(program, []);
        });
    });

    describe('namespaced functions', () => {
        it('does not mark as uninitialised vars when used within namespace', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/namespace-functions.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('does not mark as uninitialised vars when used in a class within namespace', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/namespace-functions-in-class.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [];
            expect(actual).deep.equal(expected);
        });

        it('does mark as uninitialised vars when used outside of namespace', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/namespace-functions-outside-namespace.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `11:cannot-find-function:Cannot find function 'one'`,
                `11:uninitialized-variable:Using uninitialised variable 'one' when this file is included in scope 'source'`
            ];
            expect(actual).deep.equal(expected);
        });

        it('does mark as uninitialised vars when used outside of namespace with multiple levels', async () => {
            const diagnostics = await linter.run({
                ...project1,
                files: ['source/namespace-functions-outside-namespace-multiple-levels.bs'],
                rules: {
                    'unused-variable': 'error'
                }
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `18:cannot-find-function:Cannot find function 'one'`,
                `18:uninitialized-variable:Using uninitialised variable 'one' when this file is included in scope 'source'`
            ];
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
            `06:unsafe-initialization:Not all the code paths assign 'b'`,
            `16:unsafe-initialization:Not all the code paths assign 'b'`,
            `25:unsafe-initialization:Not all the code paths assign 'b'`,
            `42:unsafe-initialization:Not all the code paths assign 'b'`,
            `51:unsafe-initialization:Not all the code paths assign 'b'`,
            `62:unsafe-initialization:Not all the code paths assign 'b'`,
            `71:unsafe-initialization:Not all the code paths assign 'b'`,
            `83:unsafe-initialization:Not all the code paths assign 'b'`,
            `85:unsafe-initialization:Not all the code paths assign 'b'`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements assign-all-paths with conditional compilation', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/assign-all-paths-conditional-compilation.brs'],
            rules: {
                'assign-all-paths': 'error',
                'consistent-return': 'off',
                'unused-variable': 'off'
            },
            diagnosticFilters: [1001, 1090]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `15:unsafe-initialization:Not all the code paths assign 'a'`,
            `23:unsafe-initialization:Not all the code paths assign 'a'`,
            `42:unsafe-initialization:Not all the code paths assign 'a'`,
            `65:unsafe-initialization:Not all the code paths assign 'a'`,
            `76:unsafe-initialization:Not all the code paths assign 'a'`
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
                'unused-variable': 'off',
                'unused-parameter': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `18:unsafe-initialization:Not all the code paths assign 'b'`,
            `27:unsafe-initialization:Not all the code paths assign 'b'`,
            `67:cannot-find-function:Cannot find function 'Bar'`,
            `67:not-constructable:Cannot use the 'new' keyword here because 'Bar' is not a constructable type`
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
            `05:unsafe-initialization:Not all the code paths assign 'a'`,
            `15:unsafe-initialization:Not all the code paths assign 'b'`
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
            `05:unsafe-iterator-variable:Using iterator variable 'i' outside loop`,
            `14:unsafe-iterator-variable:Using iterator variable 'a' outside loop`
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
            `02:uninitialized-variable:Using uninitialised variable 'err' when this file is included in scope 'source'`,
            `08:uninitialized-variable:Using uninitialised variable 'err' when this file is included in scope 'source'`
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
            `04:unreachable-code:Unreachable code`,
            `10:unreachable-code:Unreachable code`,
            `26:unreachable-code:Unreachable code`,
            `41:unreachable-code:Unreachable code`,
            `50:unreachable-code:Unreachable code`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements case-sensitivity', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/case-sensitivity.brs'],
            rules: {
                'case-sensitivity': 'error',
                'unused-variable': 'off',
                'unused-parameter': 'off'
            },
            diagnosticFilters: [1001]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `03:case-mismatch:Variable 'A' was previously set with a different casing as 'a'`,
            `04:case-mismatch:Variable 'A' was previously set with a different casing as 'a'`,
            `05:case-mismatch:Variable 'A' was previously set with a different casing as 'a'`,
            `06:case-mismatch:Variable 'A' was previously set with a different casing as 'a'`,
            `11:case-mismatch:Variable 'A' was previously set with a different casing as 'a'`,
            `15:case-mismatch:Variable 'a' was previously set with a different casing as 'A'`
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
            },
            diagnosticFilters: [1142]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `04:return-type-mismatch:Type 'integer' is not compatible with declared return type 'void' '`,
            `04:return-value-found:Sub as void should not return a value`,
            `04:unexpected-return-value:Void sub may not return a value`,
            `11:return-type-mismatch:Type 'string' is not compatible with declared return type 'void' '`,
            `11:return-value-found:Function as void should not return a value`,
            `11:unexpected-return-value:Void function may not return a value`,
            `151:unsafe-return-value:Not all code paths return a value`,
            `15:missing-return-value:Sub should consistently return a value`,
            `15:return-type-mismatch:Type 'void' is not compatible with declared return type 'string' '`,
            `18:return-type-coercion-mismatch:Function has no return statement and will return 'invalid': 'string' cannot be coerced into 'invalid'`,
            `18:unsafe-return-value:Not all code paths return a value`,
            `22:missing-return-value:Function should consistently return a value`,
            `25:unsafe-return-value:Not all code paths return a value`,
            `32:unsafe-return-value:Not all code paths return a value`,
            `39:unsafe-return-value:Not all code paths return a value`,
            `45:return-type-coercion-mismatch:Function has no return statement and will return 'invalid': 'string' cannot be coerced into 'invalid'`,
            `45:unsafe-return-value:Not all code paths return a value`,
            `49:unsafe-return-value:Not all code paths return a value`
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
            `02:unused-variable:Variable 'a' is set but value is never used`,
            `08:unused-variable:Variable 'a' is set but value is never used`,
            `12:unused-variable:Variable 'a' is set but value is never used`,
            `21:unused-variable:Variable 'd' is set but value is never used`
        ];
        expect(actual).deep.equal(expected);
    });

    it('implements unused-parameter', async () => {
        const diagnostics = await linter.run({
            ...project1,
            files: ['source/unused-parameter.brs'],
            rules: {
                'unused-parameter': 'error'
            }
        });
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `01:unused-parameter:Parameter 'unusedParam' is set but value is never used`,
            `06:unused-parameter:Parameter 'hey' is set but value is never used`
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
            diagnosticFilters: [1001, 1141]
        } as any);
        const actual = fmtDiagnostics(diagnostics);
        const expected = [
            `14:unused-variable:Variable 'a' is set but value is never used`
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
                    'case-sensitivity': 'error',
                    'unused-parameter': 'off'
                },
                fix: true
            });
            const actual = fmtDiagnostics(diagnostics);
            const expected = [
                `11:unused-variable:Variable 'A' is set but value is never used`
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
