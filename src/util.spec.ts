import { normalizeConfig, getDefaultRules, mergeConfigs, resolveContext } from './util';
import { parse } from 'jsonc-parser';
import { readFileSync } from 'fs';
import { expect } from 'chai';
import { BsLintConfig } from './index';
import { BrsFile, Program } from 'brighterscript';

describe('normalizeConfig', () => {
    const cwd = process.cwd();
    const bslint1Base = parse(readFileSync('test/project1/bslint.json').toString());
    const bslint1Defaults = mergeConfigs({ rules: getDefaultRules() }, bslint1Base);

    afterEach(() => {
        process.chdir(cwd);
    });

    it('should load specified config', () => {
        const options = {
            lintConfig: 'test/project1/bslint.json'
        };
        const actual = normalizeConfig(options);
        expect(actual).deep.equal({ ...options, ...bslint1Defaults });
    });

    it('should use `cwd` to locate the config', () => {
        const options = {
            cwd: 'test/project1',
            lintConfig: 'bslint.json'
        };
        process.chdir(options.cwd);
        const actual = normalizeConfig(options);
        expect(actual).deep.equal({ ...options, ...bslint1Defaults });
    });

    it('should look for the default config file in the bsconfig.json location', () => {
        const options = {
            project: 'test/project1/bsconfig.json'
        };
        const actual = normalizeConfig(options);
        expect(actual).deep.equal({ ...options, ...bslint1Defaults });
    });

    it('should look for the default config file in the rootDir location', () => {
        const options = {
            rootDir: 'test/project1'
        };
        const actual = normalizeConfig(options);
        expect(actual).deep.equal({ ...options, ...bslint1Defaults });
    });

    it('should find the default config file in the current location', () => {
        const options = {
            cwd: 'test/project1'
        };
        const actual = normalizeConfig(options);
        expect(actual).deep.equal({ ...options, ...bslint1Defaults });
    });

    it('should combine rules', () => {
        const options: BsLintConfig = {
            cwd: 'test/project1',
            rules: {
                'unreachable-code': 'error',
                'consistent-return': 'off'
            }
        };
        const actual = normalizeConfig(options);
        expect(actual.rules['unreachable-code']).equals('error');
        expect(actual.rules['consistent-return']).equals('off');
    });
});

describe('resolveContext', () => {
    it('should support no ignores', () => {
        const program = new Program({});
        const context = resolveContext(program);
        const file = new BrsFile('test/project1/source/unused-variable.brs', 'pkg://unused-variable.brs', program);

        expect(context.ignores(null)).equals(true);
        expect(context.ignores(file)).equals(false);
    });

    it('should allow ignoring specific files', () => {
        const program = new Program({
            ignores: ['unused-variable.brs']
        } as any);
        const context = resolveContext(program);
        const file1 = new BrsFile('test/project1/source/unused-variable.brs', 'pkg://unused-variable.brs', program);
        const file2 = new BrsFile('test/project1/source/block-if.brs', 'pkg://block-if.brs', program);

        expect(context.ignores(null)).equals(true);
        expect(context.ignores(file1)).equals(true);
        expect(context.ignores(file2)).equals(false);
    });

    it('should allow ignoring globbed files', () => {
        const program = new Program({
            ignores: ['source/**/unused*', '**/*.spec.brs']
        } as any);
        const context = resolveContext(program);
        const file1 = new BrsFile('test/project1/source/unused-variable.brs', 'pkg://unused-variable.brs', program);
        const file2 = new BrsFile('test/project1/source/block-if.brs', 'pkg://block-if.brs', program);
        const file3 = new BrsFile('test/project1/source/block-if.spec.brs', 'pkg://block-if.spec.brs', program);

        expect(context.ignores(null)).equals(true);
        expect(context.ignores(file1)).equals(true);
        expect(context.ignores(file2)).equals(false);
        expect(context.ignores(file3)).equals(true);
    });
});
