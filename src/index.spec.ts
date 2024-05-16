import Ajv from 'ajv';
import { expect } from 'chai';
import type { BsLintConfig } from '.';
import { BsLintJsonAllRules } from './__fixture__/bslint.json';
import BsLintSchema from './schema/bslint.schema.json';

describe('index', () => {
    const validator = new Ajv().compile(BsLintSchema);

    it('Validate if bslint.json fixture matches json-schema and types', () => {
        const config: BsLintConfig = BsLintJsonAllRules;
        const result = validator(config);
        expect(validator.errors).equal(null);
        expect(result).equal(true);
    });
});
