import { normalizeConfig, getDefaultRules, mergeConfigs } from './util';
import { parse } from 'jsonc-parser';
import { readFileSync } from 'fs';
import { expect } from 'chai';
import { BsLintConfig } from './index';

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
