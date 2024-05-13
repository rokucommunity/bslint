import { expect } from 'chai';
import { Validator } from 'jsonschema';
import type { BsLintConfig } from '.';
import { BsLintJsonAllRules } from './__fixture__/bslint.json';
import BsLintSchema from './schema/bslint.schema.json';

describe('index', () => {
    it('Validate if bslint.json fixture matches json-schema and types', () => {
        const config: BsLintConfig = BsLintJsonAllRules;
        const validator = new Validator();
        const result = validator.validate(config, BsLintSchema);
        expect(result.valid).equal(true);
    });
});
