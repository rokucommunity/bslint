# bslint - BrighterScript Lint

[![build](https://img.shields.io/github/workflow/status/rokucommunity/bslint/build.svg?logo=github)](https://github.com/rokucommunity/bslint/actions?query=workflow%3Abuild)
[![Coverage Status](https://coveralls.io/repos/github/rokucommunity/bslint/badge.svg?branch=master)](https://coveralls.io/github/rokucommunity/bslint?branch=master)
[![NPM Version](https://img.shields.io/npm/v/@rokucommunity/bslint.svg)](https://www.npmjs.com/package/@rokucommunity/bslint)

[brighterscript](https://github.com/rokucommunity/brighterscript) is a Roku
BrightScript compiler featuring many diagnostics out of the box: syntax check,
function calls validation, script imports verification...

`bslint` is:

- a CLI tool to lint your code without compiling your project,
- a `brighterscript` plugin offering **additional insights** on your code.

## Installation

You need Node 10+ and `npm` or `yarn`:

```bash
# if you don't have a package.json
npm init -y

# install modules
npm install brighterscript @rokucommunity/bslint
```

**Important**: add the plugin to your `bsconfig.json` file in the root of your project,
or create a minimal `bsconfig.json` like that:

```json
{
    "plugins": [ "@rokucommunity/bslint" ]
}
```

Otherwise, you will only see issues coming from the
[brighterscript](https://github.com/rokucommunity/brighterscript) compiler.

### Command line interface (CLI)

The `bslint` command will run the BrighterScript compiler without publishing
step, only outputing the diagnostics.

*Note: the CLI can be used without adding the `bslint` plugin; you will only
get the default `brighterscript` diagnostics.*

```bash
npx bslint --help

# lint with default options
npx bslint

# lint and fix basic code-style issues (see below)
npx bslint --fix

# lint and attempt to identify unused components and scripts (see below)
npx bslint --checkUsage
```

or add a `npm` script in `package.json`, e.g.:

```json
{
    ...
    "scripts": {
        "lint": "bslint"
    }
    ...
}
```
and call `npm run lint`.

## Plugin configuration

`bslint` can be configured using a `bslint.json` file in the root of your project.

Note: `bslint.json` is not the same file as `bsconfig.json`!

```json
{
    "rules": {},
    "globals": [],
    "ignores": []
}
```

Where each value is optional:

- `rules`: see below
- `globals`: a list of tokens which should always be considered as safe (ex. `_brs_`)
- `ignores`: a list of files or globs of files to omit from linting

### Ignores

Unlike `brighterscripts`'s `diagnosticFilter` which hides issues, `bslint` will completely
skip ignored files when running the extra linting rules.

*Note: it won't remove issues reported by the compiler itself!*

Format should follow "glob search" rules, as implemented in
[minimatch](https://www.npmjs.com/package/minimatch) module.

Examples:

- `"lib/**/*"`: ignore everything under any `lib` folder,
- `"**/lib/**/*"`: same with explicit initial wildcard (added automatically if missing)
- `"specific-script.brs"`: ignore specific file name
- `"*.test.brs"`: partial match of file name

## Rules

Linting rules can be set in a `bslint.json` file in the root of your project.

Rules are organised in 3 categories:

- "Code style": how the code should look like for consistency
- "Strictness": requirement to ensure code safety
- "Code flow": tracks the code flow to identify risky patterns

Default rules:

```json
{
    "rules": {
        "inline-if-style": "then",
        "block-if-style": "no-then",
        "condition-style": "no-group",
        "named-function-style": "auto",
        "anon-function-style": "auto",
        "aa-comma-style": "no-dangling",
        "no-print": "off",

        "type-annotations": "off",

        "assign-all-paths": "error",
        "unsafe-path-loop": "error",
        "unsafe-iterators": "error",
        "unreachable-code": "info",
        "case-sensitivity": "warn",
        "unused-variable": "warn",
        "consistent-return": "error"
    }
}
```

### Code style rules

- `inline-if-style`: validation of inline `if/then` statements.

    - `never`: do not allow,
    - `no-then`: do not use `then` keyword
    - `then`: always use `then` keyword (**default**)
    - `off`: do not validate

- `block-if-style`: validation of regular block `if/then` statements.

    - `no-then`: do not use `then` keyword (**default**)
    - `then`: always use `then` keyword
    - `off`: do not validate

- `condition-style`: validation of `if/while` statements conditions:
  should the condition be wrapped around parenthesis?

    - `no-group`: do not wrap with parenthesis (**default**)
    - `group`: always wrap with parentheses
    - `off`: do not validate

- `named-function-style`, `anon-function-style`: validation of function style (`function/sub`)

    - `no-function`: always use `sub`
    - `no-sub`: always use `function`
    - `auto`: use `sub` for `Void` functions, otherwise use `function` (**default**)
    - `off`: no not validate

- `aa-comma-style`: validation of commas in Associative Array (AA) literals

    - `always`: enforce the presence of commas, always
    - `no-dangling`: enforce the presence of commas but don't leave one dangling (**default**)
    - `never`: enforce that optional commas aren't used
    - `off`: do not validate

- `no-print`: prevent usage of `print` statements in code (`error | warn | info | off`)

### Strictness rules

- `type-annotations`: validation of presence of `as` type annotations, for function
  arguments and return values.

    - `all`: enforce both arguments and return type annotations
    - `return`: enforce return type annotations
    - `args`: enforce arguments type annotations
    - `off`: do not validate (**default**)

### Code flow rules

Valid values for the rules severity are: `error | warn | info | off`.

- `assign-all-paths`: a variable is not assigned in all the possible code paths,

    ```vb
    if a then
        b = "something"
    end if
    print b ' error
    ```

- `unsafe-path-loop`: loops are considered as unsafe code paths: assignment in a
  loop may not happen.

    ```vb
    for i = 0 to n
        b = "something"
    end if
    print b ' b may not have been assigned
    ```

- `unsafe-iterators`: loop iterator variable should not be used outside a loop

    ```vb
    for i = 0 to n
        b = "something"
    end if
    print i ' value could be invalid
    ```

- `case-sensitivity`: inform of inconsistent variable casing

- `unused-variable`: inform of variable being set but never used

- `unreachable-code`: inform of unreachable code
    ```vb
    return
    print "is unreachable"
    ```

- `consistent-return`: verifies consistency of `sub`/`function` returned values
  (missing return, missing value, returned value while function is `as void`,...)

## Automatic fixing (experimental)

Running `bslint` with `--fix` parameter will attempt to fix common code-style issues:

- Using wrong `sub` or `function` keyword,
- Using/missing the optional `then` keyword,
- Using/missing parenthesis around `if/while` conditions.
- Adding/removing Associative Array (AA) literals' commas where needed.
- Case sensitivity (align with first occurence)

## Usage checking (approximative)

Running `bslint` with `--checkUsage` parameter will attempt to identify unused components and scripts:

- Starting from `main.brs` the scripts and components are "walked",
- All the literal strings are matched (case insensitive) with XML component names,
- All the component included scripts are walked,
- All the component's explicit children (under `<children>` tag) are walked,
- Any script/component not walked will produce a warning.

## Changelog
Click [here](CHANGELOG.md) to view the changelog
