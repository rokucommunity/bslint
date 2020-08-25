#!/usr/bin/env node
import * as yargs from 'yargs';
import { DiagnosticSeverity } from 'brighterscript/dist/parser/ASTUtils';
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
	.option('watch', { type: 'boolean', defaultDescription: 'false', description: 'Watch input files.' }).argv;

run(options as any);

async function run(options: BsLintConfig) {
	if (options.cwd) {
		process.chdir(options.cwd);
	}
	const config = normalizeConfig(options);
	const linter = new Linter();
	try {
		const diagnostics = await linter.run(config);
		// if this is a single run (i.e. not watch mode) and there are error diagnostics, return an error code
		const hasError = !!diagnostics.find((x) => x.severity === DiagnosticSeverity.Error);
		if (config.watch === false && hasError) {
			process.exit(1);
		}
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
