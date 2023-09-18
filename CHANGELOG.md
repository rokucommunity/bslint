# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [0.8.10](https://github.com/rokucommunity/bslint/compare/v0.8.9...v0.8.10) - 2023-09-11
### Changed
 - upgrade to [brighterscript@0.65.5](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0655---2023-09-06). Notable changes since 0.65.4:
     - support bs_const in bsconfig.json ([brighterscript#887](https://github.com/rokucommunity/brighterscript/pull/887))
     - allow optionally specifying bslib destination directory ([brighterscript#871](https://github.com/rokucommunity/brighterscript/pull/871))
     - ensure consistent insertion of bslib.brs ([brighterscript#870](https://github.com/rokucommunity/brighterscript/pull/870))
     - Fix crashes in util for null ranges ([brighterscript#869](https://github.com/rokucommunity/brighterscript/pull/869))
     - Print diagnostic related information ([brighterscript#867](https://github.com/rokucommunity/brighterscript/pull/867))
     - Fix tab issue when printing diagnostics ([brighterscript#865](https://github.com/rokucommunity/brighterscript/pull/865))



## [0.8.9](https://github.com/rokucommunity/bslint/compare/v0.8.8...v0.8.9) - 2023-07-24
### Changed
 - upgrade to [brighterscript@0.65.4](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0654---2023-07-24). Notable changes since 0.65.2:
     - Install `v8-profiler-next` on demand instead of being a dependency ([brighterscript#854](https://github.com/rokucommunity/brighterscript/pull/854))
     - Bump word-wrap from 1.2.3 to 1.2.4 ([brighterscript#851](https://github.com/rokucommunity/brighterscript/pull/851))



## [0.8.8](https://github.com/rokucommunity/bslint/compare/v0.8.7...v0.8.8) - 2023-07-17
### Changed
 - upgrade to [brighterscript@0.65.2](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0652---2023-07-17). Notable changes since 0.65.1:
     - Prevent crashing when diagnostic is missing range. ([brighterscript#832](https://github.com/rokucommunity/brighterscript/pull/832))
     - Prevent crash when diagnostic is missing range ([brighterscript#831](https://github.com/rokucommunity/brighterscript/pull/831))
### Fixed
 - code flow bug with try/catch ([#93](https://github.com/rokucommunity/bslint/pull/93))
 - performance issues due to needless duplicate global var lookups ([#92](https://github.com/rokucommunity/bslint/pull/92))



## [0.8.7](https://github.com/rokucommunity/bslint/compare/v0.8.6...v0.8.7) - 2023-07-05
### Changed
 - upgrade to [brighterscript@0.65.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0651---2023-06-09). Notable changes since 0.65.0:
     - Fix injection of duplicate super calls into classes ([brighterscript#823](https://github.com/rokucommunity/brighterscript/pull/823))



## [0.8.6](https://github.com/rokucommunity/bslint/compare/v0.8.5...v0.8.6) - 2023-05-17
### Changed
 - upgrade to [brighterscript@0.65.0](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0650---2023-05-17)



## [0.8.5](https://github.com/rokucommunity/bslint/compare/v0.8.4...v0.8.5) - 2023-05-10
### Changed
 - upgrade to [brighterscript@0.64.4](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0644---2023-05-10)



## [0.8.4](https://github.com/rokucommunity/bslint/compare/v0.8.3...v0.8.4) - 2023-04-28
### Changed
 - upgrade to [brighterscript@0.64.3](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0643---2023-04-28). Notable changes since 0.64.2:
     - Improves performance in symbol table fetching ([brighterscript#797](https://github.com/rokucommunity/brighterscript/pull/797))



## [0.8.3](https://github.com/rokucommunity/bslint/compare/v0.8.2...v0.8.3) - 2023-04-18
### Changed
 - upgrade to [brighterscript@0.64.2](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0642---2023-04-18). Notable changes since 0.62.0:
     - Fix namespace-relative enum value ([brighterscript#793](https://github.com/rokucommunity/brighterscript/pull/793))
     - Fix namespace-relative items ([brighterscript#789](https://github.com/rokucommunity/brighterscript/pull/789))
     - Wrap transpiled template strings in parens ([brighterscript#788](https://github.com/rokucommunity/brighterscript/pull/788))
     - Simplify the ast range logic ([brighterscript#784](https://github.com/rokucommunity/brighterscript/pull/784))
### Fixed 
 - do not consider consts as unused variables ([#85](https://github.com/rokucommunity/bslint/pull/85))



## [0.8.2](https://github.com/rokucommunity/bslint/compare/v0.8.1...v0.8.2) - 2023-03-17
### Changed
 - upgrade to [brighterscript@0.62.0](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0620---2023-03-17). Notable changes since 0.61.3:
     - Optional chaining assignment validation ([brighterscript#782](https://github.com/rokucommunity/brighterscript/pull/782))
     - Fix transpile bug with optional chaning ([brighterscript#781](https://github.com/rokucommunity/brighterscript/pull/781))
     - Add 'severityOverride' option ([brighterscript#725](https://github.com/rokucommunity/brighterscript/pull/725))
     - Fix crash when func has no block ([brighterscript#774](https://github.com/rokucommunity/brighterscript/pull/774))
     - Move not-referenced check into ProgramValidator ([brighterscript#773](https://github.com/rokucommunity/brighterscript/pull/773))



## [0.8.1](https://github.com/rokucommunity/bslint/compare/v0.8.0...v0.8.1) - 2023-01-12
### Changed
 - upgrade to [brighterscript@0.61.3](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0613---2023-01-12). Notable changes since 0.61.1:
     - Add diagnostic for passing more than 5 arguments to a callFunc ([brighterscript#765](https://github.com/rokucommunity/brighterscript/pull/765))



## [0.8.0](https://github.com/rokucommunity/bslint/compare/v0.7.7...0.8.0) - 2022-12-09
### Changed
 - re-released the content from v0.7.6 but with a minor version bump instead of patch



## [0.7.7](https://github.com/rokucommunity/bslint/compare/v0.7.6...0.7.7) - 2022-12-09
### Changed
 - Roll back v0.7.6 because it introduced breaking peerDependency changes. That should have been introduced in v0.8.0



## [0.7.6](https://github.com/rokucommunity/bslint/compare/v0.7.5...0.7.6) - 2022-12-08
### Added
 - Add new aa-comma-style all-except-single-line. ([#80](https://github.com/rokucommunity/bslint/pull/80))
### Fixed
 - Avoid false positive for missing return ([#78](https://github.com/rokucommunity/bslint/pull/78))
 - upgrade to [brighterscript@0.61.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0611---2022-12-07). Notable changes since 0.57.0:
     - Fix exception while validating continue statement ([brighterscript#752](https://github.com/rokucommunity/brighterscript/pull/752))
     - Add missing visitor params for DottedSetStatement ([brighterscript#748](https://github.com/rokucommunity/brighterscript/pull/748))
     - Flag incorrectly nested statements ([brighterscript#747](https://github.com/rokucommunity/brighterscript/pull/747))
     - Cache `getCallableByName` ([brighterscript#739](https://github.com/rokucommunity/brighterscript/pull/739))
     - Prevent namespaces being used as variables ([brighterscript#738](https://github.com/rokucommunity/brighterscript/pull/738))
     - Refactor SymbolTable and AST parent logic ([brighterscript#732](https://github.com/rokucommunity/brighterscript/pull/732))
     - Fix crash in `getDefinition` ([brighterscript#734](https://github.com/rokucommunity/brighterscript/pull/734))
     - Remove parentStack to prevent circular references ([brighterscript#731](https://github.com/rokucommunity/brighterscript/pull/731))
     - Allow `continue` as local var ([brighterscript#730](https://github.com/rokucommunity/brighterscript/pull/730))
     - Add name to symbol table ([brighterscript#728](https://github.com/rokucommunity/brighterscript/pull/728))
     - better parse recover for unknown func params ([brighterscript#722](https://github.com/rokucommunity/brighterscript/pull/722))
     - Fix if statement block var bug ([brighterscript#698](https://github.com/rokucommunity/brighterscript/pull/698))
     - Beter location for bs1042 ([brighterscript#719](https://github.com/rokucommunity/brighterscript/pull/719))
     - adds goto definition for enum statements and enum members ([brighterscript#715](https://github.com/rokucommunity/brighterscript/pull/715))
     - fixes signature help resolution for callexpressions ([brighterscript#707](https://github.com/rokucommunity/brighterscript/pull/707))
     - Allow nested namespaces ([brighterscript#708](https://github.com/rokucommunity/brighterscript/pull/708))
     - Expose an 'isThrowStatement' utility function for plugins ([brighterscript#709](https://github.com/rokucommunity/brighterscript/pull/709))
     - Migrate to `stagingDir` away from `stagingFolder` ([brighterscript#706](https://github.com/rokucommunity/brighterscript/pull/706))
     - Fix enum error for negative values ([brighterscript#703](https://github.com/rokucommunity/brighterscript/pull/703))
     - Support `pkg:/` paths for `setFile` ([brighterscript#701](https://github.com/rokucommunity/brighterscript/pull/701))
     - Syntax and transpile support for continue statement ([brighterscript#697](https://github.com/rokucommunity/brighterscript/pull/697))
     - Add AST child searching functionality. ([brighterscript#695](https://github.com/rokucommunity/brighterscript/pull/695))
     - Finds and includes more deeply embedded expressions ([brighterscript#696](https://github.com/rokucommunity/brighterscript/pull/696))
     - Fix xml parse bug during benchmarking ([#brighterscript0805c1f](https://github.com/rokucommunity/brighterscript/commit/0805c1f))
     - Scope validation performance boost ([brighterscript#656](https://github.com/rokucommunity/brighterscript/pull/656))
     - Rename refs  to isClass(field|method)Statement ([brighterscript#694](https://github.com/rokucommunity/brighterscript/pull/694))
     - Create common ancestor for Expression and Statement ([brighterscript#693](https://github.com/rokucommunity/brighterscript/pull/693))
     - Move file validation into BscPlugin ([brighterscript#688](https://github.com/rokucommunity/brighterscript/pull/688))
     - Fix brightscript.configFile workspace config bug ([brighterscript#686](https://github.com/rokucommunity/brighterscript/pull/686))
     - fix(parser): consider namespace function transpiled names ([brighterscript#685](https://github.com/rokucommunity/brighterscript/pull/685))



## [0.7.5](https://github.com/rokucommunity/bslint/compare/v0.7.4...0.7.5) - 2022-09-02
### Changed
 - upgrade to [brighterscript@0.57.0](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0570---2022-09-02). Notable changes since 0.56.0:
     - Allow `mod` as an aa prop, aa member identifier kinds forced to Identifier ([brighterscript#684](https://github.com/rokucommunity/brighterscript/pull/684))
     - Doc Scraper Fixes ([brighterscript#585](https://github.com/rokucommunity/brighterscript/pull/585))
     - Validate too deep nested files ([brighterscript#680](https://github.com/rokucommunity/brighterscript/pull/680))
     - Fix case sensitivity issue with bs_const values ([brighterscript#677](https://github.com/rokucommunity/brighterscript/pull/677))



## [0.7.4](https://github.com/rokucommunity/bslint/compare/v0.7.3...0.7.4) - 2022-08-24
### Changed
 - Fixes issue with tagging namespaced function as Unitialized Vars ([#74](https://github.com/rokucommunity/bslint/pull/74))
 - upgrade to [brighterscript@0.56.0](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0560---2022-08-23). Notable changes since 0.55.1:
     - Fix compile crash for scope-less files ([brighterscript#674](https://github.com/rokucommunity/brighterscript/pull/674))
     - Fix parse error for malformed dim statement ([brighterscript#673](https://github.com/rokucommunity/brighterscript/pull/673))
     - Add validation for dimmed variables ([brighterscript#672](https://github.com/rokucommunity/brighterscript/pull/672))
     - Allow const as variable name ([brighterscript#670](https://github.com/rokucommunity/brighterscript/pull/670))
     - Dedupe code completions in components ([brighterscript#664](https://github.com/rokucommunity/brighterscript/pull/664))



## [0.7.3](https://github.com/rokucommunity/bslint/compare/v0.7.2...0.7.3) - 2022-08-12
### Changed
 - upgrade to [brighterscript@0.55.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0551---2022-08-07). Notable changes since 0.53.1:
     - Fix scope-specific diagnostic grouping issue ([brighterscript#660](https://github.com/rokucommunity/brighterscript/pull/660))
     - Fix typescript error for ast parent setting ([brighterscript#659](https://github.com/rokucommunity/brighterscript/pull/659))
     - Fix missing constant references ([brighterscript#658](https://github.com/rokucommunity/brighterscript/pull/658))
     - Link all brs AST nodes to parent onFileValidate ([brighterscript#650](https://github.com/rokucommunity/brighterscript/pull/650))
     - Add a `toJSON` function to SymbolTable ([brighterscript#655](https://github.com/rokucommunity/brighterscript/pull/655))
     - Performance boost: better function sorting during validation ([brighterscript#651](https://github.com/rokucommunity/brighterscript/pull/651))
     - Add semantic token color for consts ([brighterscript#654](https://github.com/rokucommunity/brighterscript/pull/654))
     - Add go-to-definition support for const statements ([brighterscript#653](https://github.com/rokucommunity/brighterscript/pull/653))
     - Fix broken plugin imports with custom cwd ([brighterscript#652](https://github.com/rokucommunity/brighterscript/pull/652))
     - Fix bug in languageserver hover provider ([brighterscript#649](https://github.com/rokucommunity/brighterscript/pull/649))
     - Add hover for CONST references. ([brighterscript#648](https://github.com/rokucommunity/brighterscript/pull/648))
     - Allow plugins to contribute completions ([brighterscript#647](https://github.com/rokucommunity/brighterscript/pull/647))
     - Plugin support for hover ([brighterscript#393](https://github.com/rokucommunity/brighterscript/pull/393))
     - Export some vscode interfaces ([brighterscript#644](https://github.com/rokucommunity/brighterscript/pull/644))
     - Better plugin docs ([brighterscript#643](https://github.com/rokucommunity/brighterscript/pull/643))



## [0.7.2](https://github.com/rokucommunity/bslint/compare/v0.7.1...0.7.2) - 2022-07-18
### Changed
 - upgrade to [brighterscript@0.53.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0531---2022-07-15)
### Fixed
 - Use smaller range for LINT3010 ([#70](https://github.com/rokucommunity/bslint/pull/70))



## [0.7.1](https://github.com/rokucommunity/bslint/compare/v0.7.0...v0.7.1) - 2022-05-09
### Fixed
 - error variable from `catch` statement should be available within the `catch` block ([#64](https://github.com/rokucommunity/bslint/pull/64))
 - Prevent "unused var" in `goto` loop ([#65](https://github.com/rokucommunity/bslint/pull/65))



## [0.7.0](https://github.com/rokucommunity/bslint/compare/v0.6.1...v0.7.0) - 2022-04-13
### Added
 - `no-todo` code style rule ([#56](https://github.com/rokucommunity/bslint/pull/56))
 - `no-stop` rule ([#57](https://github.com/rokucommunity/bslint/pull/57))
 - `newline-last` rule ([#58](https://github.com/rokucommunity/bslint/pull/58))
### Changed
 - upgrade to brighterscript@0.48.0
### Fixed
 - do not consider enums as unused variables ([#59](https://github.com/rokucommunity/bslint/pull/59))



## [0.6.0](https://github.com/rokucommunity/bslint/compare/v0.6.0...v0.6.1) - 2022-03-24
### Changed
 - upgrade to brighterscript@0.45.3
### Fixed
 - npm audit issues



## [0.6.0](https://github.com/rokucommunity/bslint/compare/v0.5.0...v0.6.0) - 2021-10-27
### Added
 - associative array comma linting and fixing ([#40](https://github.com/rokucommunity/bslint/pull/40))
 - automatic code fix for removing `as void` when changing a function to sub ([#42](https://github.com/rokucommunity/bslint/pull/40))



## [0.5.0](https://github.com/rokucommunity/bslint/compare/v0.4.0...v0.5.0) - 2021-07-07
### Added
 - check scripts/components usage (behind `--checkUsage` flag). ([#35](https://github.com/rokucommunity/bslint/pull/35))


## [0.4.0](https://github.com/rokucommunity/bslint/compare/v0.3.0...v0.4.0) - 2021-05-25
### Added
 - automatic code fixes ([#28](https://github.com/rokucommunity/bslint/pull/28))
    - function/sub style
    - `then` style
    - if condition grouping with/without parenthesis



## [0.3.0](https://github.com/rokucommunity/bslint/compare/v0.2.0...v0.3.0) - 2021-05-19
### Added
 - Add ignores and globals ([#27](https://github.com/rokucommunity/bslint/pull/27))
### Fixed
 - invoking classes fix ([#26](https://github.com/rokucommunity/bslint/pull/26))



## [0.2.0](https://github.com/rokucommunity/bslint/compare/v0.1.0...v0.2.0) - 2021-05-13
### Added
 - no-print-rule ([#19](https://github.com/rokucommunity/bslint/pull/19))
 - Add namespaces and super ([#24](https://github.com/rokucommunity/bslint/pull/24))



## [0.1.0](https://github.com/rokucommunity/bslint/compare/213c530d29ff49771da2860cf4cae79c5341e8cb...v0.1.0) - 2021-02-22
### Added
Initial release