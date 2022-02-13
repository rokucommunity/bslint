#!/usr/bin/env node
import * as yargs from 'yargs';
import { DiagnosticSeverity } from 'brighterscript';
import { BsLintConfig, Linter } from '.';
import { normalizeConfig } from './util';

const options = yargs
    .usage('$0', 'Bright(er)Script code linter')
    .option('cwd', { type: 'string', description: 'Override the current working directory.' })
    .option('files', {
        type: 'array',
        description:
            'The list of files (or globs) to include in your project. Be sure to wrap these in double quotes when using globs.'
    })
    .option('project', { type: 'string', description: 'Path to a bsconfig.json project file.' })
    .option('rootDir', {
        type: 'string',
        description: 'Path to the root of your project files (where the manifest lives). Defaults to current directory.'
    })
    .option('lintConfig', { type: 'string', description: 'Path to a bslint.json configuration file.' })
    .option('fix', { type: 'boolean', description: 'Fix automatically minor issues (experimental)' })
    .option('checkUsage', { type: 'boolean', description: 'Look for potentially unused components and scripts' })
    .option('watch', { type: 'boolean', defaultDescription: 'false', description: 'Watch input files.' }).argv;

async function run(options: BsLintConfig) {
    if (options.cwd) {
        process.chdir(options.cwd);
    }
    if (options.watch) {
        options.fix = false;
    }
    const config = normalizeConfig(options);
    const linter = new Linter();
    const diagnostics = await linter.run(config);
    // if this is a single run (i.e. not watch mode) and there are error diagnostics, return an error code
    const hasError = !!diagnostics.find((x) => x.severity === DiagnosticSeverity.Error);
    if (!config.watch && hasError) {
        process.exit(1);
    }
}

run(options as any).catch((error) => {
    console.error(error);
    process.exit(1);
});
