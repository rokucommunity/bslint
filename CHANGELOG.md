# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [0.8.35](https://github.com/rokucommunity/bslint/compare/0.8.34...v0.8.35) - 2025-09-12
### Changed
 - upgrade to [brighterscript@0.70.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0701---2025-09-11). Notable changes since 0.69.13:
     - Flag param names that are reserved words ([#1556](https://github.com/rokucommunity/bslint/pull/1556))



## [0.8.34](https://github.com/rokucommunity/bslint/compare/0.8.33...v0.8.34) - 2025-08-04
### Changed
 - upgrade to [brighterscript@0.69.13](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06913---2025-08-04). Notable changes since 0.69.11:



## [0.8.33](https://github.com/rokucommunity/bslint/compare/0.8.32...v0.8.33) - 2025-07-03
### Changed
 - upgrade to [brighterscript@0.69.11](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06911---2025-07-03). Notable changes since 0.69.10:



## [0.8.32](https://github.com/rokucommunity/bslint/compare/0.8.31...v0.8.32) - 2025-06-03
### Added
 - added [brighterscript@0.69.10](https://github.com/rokucommunity/brighterscript) as a dependency instead of a devDependency



## [0.8.31](https://github.com/rokucommunity/bslint/compare/0.8.30...v0.8.31) - 2025-05-12
### Changed
 - upgrade to [brighterscript@0.69.9](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0699---2025-05-09). Notable changes since 0.69.8:
     - removed no-throw-literal lint rule ([brighterscript#1489](https://github.com/rokucommunity/brighterscript/pull/1489))
     - Add `bsc0` cli binary name ([brighterscript#1490](https://github.com/rokucommunity/brighterscript/pull/1490))



## [0.8.30](https://github.com/rokucommunity/bslint/compare/0.8.29...v0.8.30) - 2025-05-06
### Changed
 - upgrade to [brighterscript@0.69.8](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0698---2025-05-05). Notable changes since 0.69.7:



## [0.8.29](https://github.com/rokucommunity/bslint/compare/0.8.28...v0.8.29) - 2025-04-24
### Changed
 - Migrate to Shared CI ([#144](https://github.com/rokucommunity/bslint/pull/144))
 - upgrade to [brighterscript@0.69.7](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0697---2025-04-23). Notable changes since 0.68.3:
     - Prevent runtime crash for non-referencable funcs in ternary and null coalescing ([brighterscript#1474](https://github.com/rokucommunity/brighterscript/pull/1474))
     - Fix `removeParameterTypes` compile errors for return types ([brighterscript#1414](https://github.com/rokucommunity/brighterscript/pull/1414))
     - Flag incorrect return statements in functions and subs ([brighterscript#1463](https://github.com/rokucommunity/brighterscript/pull/1463))
     - Updated the type definition of the `InStr` global callable ([brighterscript#1456](https://github.com/rokucommunity/brighterscript/pull/1456))
     - Support plugin factory detecting brighterscript version ([brighterscript#1438](https://github.com/rokucommunity/brighterscript/pull/1438))
     - Fixed getClosestExpression bug to return undefined when position not found ([brighterscript#1433](https://github.com/rokucommunity/brighterscript/pull/1433))
     - Adds Alias statement syntax from v1 to v0 ([brighterscript#1430](https://github.com/rokucommunity/brighterscript/pull/1430))
     - Significantly improve the performance of standardizePath ([brighterscript#1425](https://github.com/rokucommunity/brighterscript/pull/1425))
     - Backport v1 typecast syntax to v0 ([brighterscript#1421](https://github.com/rokucommunity/brighterscript/pull/1421))
     - Prevent running the lsp project in a worker thread ([brighterscript#1423](https://github.com/rokucommunity/brighterscript/pull/1423))



## [0.8.28](https://github.com/rokucommunity/bslint/compare/v0.8.27...v0.8.28) - 2025-01-13
### Changed
 - upgrade to [brighterscript@0.68.3](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0683---2025-01-13). Notable changes since 0.68.2:
     - Fix class transpile issue with child class constructor not inherriting parent params ([brighterscript#1390](https://github.com/rokucommunity/brighterscript/pull/1390))
     - Export more items ([brighterscript#1394](https://github.com/rokucommunity/brighterscript/pull/1394))



## [0.8.27](https://github.com/rokucommunity/bslint/compare/v0.8.26...v0.8.27) - 2024-12-20
### Changed
 - upgrade to [brighterscript@0.68.2](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0682---2024-12-06). Notable changes since 0.67.8:
     - Add Namespace Source Literals ([brighterscript#1353](https://github.com/rokucommunity/brighterscript/pull/1353))
     - Enhance lexer to support long numeric literals with type designators ([brighterscript#1351](https://github.com/rokucommunity/brighterscript/pull/1351))
     - Fix issues with the ast walkArray function ([brighterscript#1347](https://github.com/rokucommunity/brighterscript/pull/1347))
     - Optimize ternary transpilation for assignments ([brighterscript#1341](https://github.com/rokucommunity/brighterscript/pull/1341))



## [0.8.26](https://github.com/rokucommunity/bslint/compare/v0.8.25...0.8.26) - 2024-10-18
### Changed
 - upgrade to [brighterscript@0.67.8](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0678---2024-10-18). Notable changes since 0.67.7:
     - Fix namespace-relative transpile bug for standalone file ([brighterscript#1324](https://github.com/rokucommunity/brighterscript/pull/1324))
     - Prevent crash when ProgramBuilder.run called with no options ([brighterscript#1316](https://github.com/rokucommunity/brighterscript/pull/1316))



## [0.8.25](https://github.com/rokucommunity/bslint/compare/v0.8.24...v0.8.25) - 2024-09-26
### Changed
 - upgrade to [brighterscript@0.67.7](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0677---2024-09-25). Notable changes since 0.67.5:
     - Ast node clone ([brighterscript#1281](https://github.com/rokucommunity/brighterscript/pull/1281))
     - Add support for resolving sourceRoot at time of config load ([brighterscript#1290](https://github.com/rokucommunity/brighterscript/pull/1290))
     - Add support for roIntrinsicDouble ([brighterscript#1291](https://github.com/rokucommunity/brighterscript/pull/1291))
     - Add plugin naming convention ([brighterscript#1284](https://github.com/rokucommunity/brighterscript/pull/1284))



## [0.8.24](https://github.com/rokucommunity/bslint/compare/v0.8.23...v0.8.24) - 2024-08-23
### Fixed
 - bug where LINT3024 and LINT3025 were doing a case-sensitive check when they should be checking case-insensitive. ([#129](https://github.com/rokucommunity/bslint/pull/129))



## [0.8.23](https://github.com/rokucommunity/bslint/compare/v0.8.22...v0.8.23) - 2024-08-22
### Added
 - add rule for roRegex duplicates ([#119](https://github.com/rokucommunity/bslint/pull/119))
### Changed
 - upgrade to [brighterscript@0.67.5](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0675---2024-07-31). Notable changes since 0.67.4:
     - Add templatestring support for annotation.getArguments() ([brighterscript#1264](https://github.com/rokucommunity/brighterscript/pull/1264))



## [0.8.22](https://github.com/rokucommunity/bslint/compare/v0.8.21...0.8.22) - 2024-07-24
### Changed
 - add rule to prevent use of `assocarray` and `array` component fields in xml ([#115](https://github.com/rokucommunity/bslint/pull/115))
 - upgrade to [brighterscript@0.67.4](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0674---2024-07-24). Notable changes since 0.67.1:
     - Fix crash with missing scope ([brighterscript#1234](https://github.com/rokucommunity/brighterscript/pull/1234))
     - fix: conform bsconfig.schema.json to strict types ([brighterscript#1205](https://github.com/rokucommunity/brighterscript/pull/1205))
     - Flag using devDependency in production code ([brighterscript#1222](https://github.com/rokucommunity/brighterscript/pull/1222))



## [0.8.21](https://github.com/rokucommunity/bslint/compare/v0.8.20...v0.8.21) - 2024-05-17
### Changed
 - fix node14 ([#106](https://github.com/rokucommunity/bslint/pull/106))
 - upgrade to [brighterscript@0.67.1](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0671---2024-05-16). Notable changes since 0.65.27:
     - Fix crash when diagnostic is missing range ([brighterscript#1174](https://github.com/rokucommunity/brighterscript/pull/1174))
     - Move function calls to separate diagnostic ([brighterscript#1169](https://github.com/rokucommunity/brighterscript/pull/1169))
     - resolve the stagingDir option relative to the bsconfig.json file ([brighterscript#1148](https://github.com/rokucommunity/brighterscript/pull/1148))
     - Upgrade to @rokucommunity/logger ([brighterscript#1137](https://github.com/rokucommunity/brighterscript/pull/1137))



## [0.8.20](https://github.com/rokucommunity/bslint/compare/v0.8.19...v0.8.20) - 2024-03-27
### Changed
 - upgrade to [brighterscript@0.65.27](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06527---2024-03-27). Notable changes since 0.65.25:
     - Improve workspace/document symbol handling ([brighterscript#1120](https://github.com/rokucommunity/brighterscript/pull/1120))
     - Plugin hook provide workspace symbol ([brighterscript#1118](https://github.com/rokucommunity/brighterscript/pull/1118))
     - Upgade LSP packages ([brighterscript#1117](https://github.com/rokucommunity/brighterscript/pull/1117))
     - Add plugin hook for documentSymbol ([brighterscript#1116](https://github.com/rokucommunity/brighterscript/pull/1116))
     - Increase max param count to 63 ([brighterscript#1112](https://github.com/rokucommunity/brighterscript/pull/1112))
     - Prevent unused variable warnings on ternary and null coalescence expressions ([brighterscript#1101](https://github.com/rokucommunity/brighterscript/pull/1101))
### Fixed
 - Fix npm audit issues ([#98](https://github.com/rokucommunity/bslint/pull/98))
 - Fix safe colors ([#101](https://github.com/rokucommunity/bslint/pull/101))


## [0.8.19](https://github.com/rokucommunity/bslint/compare/v0.8.18...v0.8.19) - 2024-03-07
### Changed
 - upgrade to [brighterscript@0.65.25](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06525---2024-03-07). Notable changes since 0.65.23:
     - Support when tokens have null ranges ([brighterscript#1072](https://github.com/rokucommunity/brighterscript/pull/1072))
     - Support whitespace in conditional compile keywords ([brighterscript#1090](https://github.com/rokucommunity/brighterscript/pull/1090))
     - Allow negative patterns in diagnostic filters ([brighterscript#1078](https://github.com/rokucommunity/brighterscript/pull/1078))



## [0.8.18](https://github.com/rokucommunity/bslint/compare/v0.8.17...v0.8.18) - 2024-02-29
### Changed
 - upgrade to [brighterscript@0.65.23](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06523---2024-02-29). Notable changes since 0.65.19:
     - empty interfaces break the parser ([brighterscript#1082](https://github.com/rokucommunity/brighterscript/pull/1082))
     - Allow v1 syntax: built-in types for class member types and type declarations on lhs ([brighterscript#1059](https://github.com/rokucommunity/brighterscript/pull/1059))
     - Move `coveralls-next` to a devDependency since it's not needed at runtime ([brighterscript#1051](https://github.com/rokucommunity/brighterscript/pull/1051))
     - Fix parsing issues with multi-index IndexedSet and IndexedGet ([brighterscript#1050](https://github.com/rokucommunity/brighterscript/pull/1050))



## [0.8.17](https://github.com/rokucommunity/bslint/compare/v0.8.16...v0.8.17) - 2024-01-30
### Changed
 - upgrade to [brighterscript@0.65.19](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06519---2024-01-30). Notable changes since 0.65.18:
     - Backport v1 syntax changes ([brighterscript#1034](https://github.com/rokucommunity/brighterscript/pull/1034))



## [0.8.16](https://github.com/rokucommunity/bslint/compare/v0.8.15...v0.8.16) - 2024-01-25
### Changed
 - upgrade to [brighterscript@0.65.18](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06518---2024-01-25). Notable changes since 0.65.17:
     - Prevent overwriting the Program._manifest if already set on startup ([brighterscript#1027](https://github.com/rokucommunity/brighterscript/pull/1027))
     - Improving null safety: Add FinalizedBsConfig and tweak plugin events ([brighterscript#1000](https://github.com/rokucommunity/brighterscript/pull/1000))



## [0.8.15](https://github.com/rokucommunity/bslint/compare/v0.8.14...v0.8.15) - 2024-01-16
### Changed
 - upgrade to [brighterscript@0.65.17](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06517---2024-01-16). Notable changes since 0.65.16:
     - adds support for libpkg prefix ([brighterscript#1017](https://github.com/rokucommunity/brighterscript/pull/1017))
     - Assign .program to the builder BEFORE calling afterProgram ([brighterscript#1011](https://github.com/rokucommunity/brighterscript/pull/1011))



## [0.8.14](https://github.com/rokucommunity/bslint/compare/v0.8.13...v0.8.14) - 2024-01-08
### Changed
 - upgrade to [brighterscript@0.65.16](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06516---2024-01-08). Notable changes since 0.65.12:
     - Prevent publishing of empty files ([brighterscript#997](https://github.com/rokucommunity/brighterscript/pull/997))
     - Improve null safety ([brighterscript#996](https://github.com/rokucommunity/brighterscript/pull/996))
     - Prevent errors when using enums in a file that's not included in any scopes ([brighterscript#995](https://github.com/rokucommunity/brighterscript/pull/995))
     - Fix multi-namespace class inheritance transpile bug ([brighterscript#990](https://github.com/rokucommunity/brighterscript/pull/990))
     - Add check for onChange function ([brighterscript#941](https://github.com/rokucommunity/brighterscript/pull/941))
     - Fix broken enum transpiling ([brighterscript#985](https://github.com/rokucommunity/brighterscript/pull/985))



## [0.8.13](https://github.com/rokucommunity/bslint/compare/v0.8.12...v0.8.13) - 2023-12-07
### Changed
 - upgrade to [brighterscript@0.65.12](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#06512---2023-12-07). Notable changes since 0.65.9:
     - Add `optional` modifier for interface and class members ([brighterscript#955](https://github.com/rokucommunity/brighterscript/pull/955))
     - Use regex for faster manifest/typedef detection ([brighterscript#976](https://github.com/rokucommunity/brighterscript/pull/976))
     - fix the create-package script ([brighterscript#974](https://github.com/rokucommunity/brighterscript/pull/974))
     - Correct RANGE in template string when dealing with quotes in annotations ([brighterscript#975](https://github.com/rokucommunity/brighterscript/pull/975))
     - Add manifest loading from files ([brighterscript#942](https://github.com/rokucommunity/brighterscript/pull/942))
     - Enums as class initial values ([brighterscript#950](https://github.com/rokucommunity/brighterscript/pull/950))



## [0.8.12](https://github.com/rokucommunity/bslint/compare/v0.8.11...v0.8.12) - 2023-11-08
### Changed
 - upgrade to [brighterscript@0.65.9](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0659---2023-11-06). Notable changes since 0.65.8:
     - Fix issue with unary expression parsing ([brighterscript#938](https://github.com/rokucommunity/brighterscript/pull/938))



## [0.8.11](https://github.com/rokucommunity/bslint/compare/v0.8.10...v0.8.11) - 2023-10-08
### Added
 - color format checking for bslint ([#94](https://github.com/rokucommunity/bslint/pull/94))
### Changed
 - chore: copy expectDiagnostics from brighterscript for tests ([#95](https://github.com/rokucommunity/bslint/pull/95))
 - upgrade to [brighterscript@0.65.8](https://github.com/rokucommunity/brighterscript/blob/master/CHANGELOG.md#0658---2023-10-06). Notable changes since 0.65.5:
     - Bump postcss from 8.2.15 to 8.4.31 ([brighterscript#928](https://github.com/rokucommunity/brighterscript/pull/928))
     - Add interface parameter support ([brighterscript#924](https://github.com/rokucommunity/brighterscript/pull/924))
     - chore: better typing for `Deferred` ([brighterscript#923](https://github.com/rokucommunity/brighterscript/pull/923))
     - chore: add missing emitDefinitions to docs and fix iface ([brighterscript#893](https://github.com/rokucommunity/brighterscript/pull/893))
     - Add some more details to the plugins docs ([brighterscript#913](https://github.com/rokucommunity/brighterscript/pull/913))
     - Fix incorrect quasi location in template string ([brighterscript#921](https://github.com/rokucommunity/brighterscript/pull/921))
     - Fix UnaryExpression transpile for ns and const ([brighterscript#914](https://github.com/rokucommunity/brighterscript/pull/914))
     - fix bug in --noproject flag logic ([brighterscript#922](https://github.com/rokucommunity/brighterscript/pull/922))
     - add noProject flag to bsc so BSConfig.json not expected ([brighterscript#868](https://github.com/rokucommunity/brighterscript/pull/868))



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
