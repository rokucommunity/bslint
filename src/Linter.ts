import { BsLintConfig } from './index';
import { ProgramBuilder, BsConfig } from 'brighterscript';

export default class Linter {
    builder: ProgramBuilder;

    constructor() {
        this.builder = new ProgramBuilder();
    }

    async run(config: BsLintConfig) {
        try {
            const options: BsConfig = {
                ...config,
                createPackage: false,
                copyToStaging: false
            };
            await this.builder.run(options);
            return this.builder.getDiagnostics();
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}
