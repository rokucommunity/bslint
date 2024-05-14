import { BsLintConfig } from './index';
import { ProgramBuilder, BsConfig } from 'brighterscript';

export const BsLintDiagnosticTag = 'BSLint';
export const BsLintDiagnosticContext = { tags: [BsLintDiagnosticTag] };


const pendingJobs: Promise<void>[] = [];

// allow some asynchronous jobs to run after the compiler has finished its work
export function addJob(job: Promise<void>) {
    pendingJobs.push(job);
    return job;
}

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
            await Promise.all(pendingJobs);
            return this.builder.getDiagnostics();
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}
