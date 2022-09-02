# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



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