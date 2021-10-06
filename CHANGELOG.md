# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.2.0](https://github.com/sonrad10/while.js/compare/v2.1.0...v2.2.0) (2021-10-06)


### Features

* added MacroManager to simplify registering macro dependencies ([ba10d82](https://github.com/sonrad10/while.js/commit/ba10d82972523a65439bed9da7d8da5d97259475))
* added ProgramManager class to simplify performing operations on programs ([a67347a](https://github.com/sonrad10/while.js/commit/a67347a37729dda8b0055667f69b42990917f607))
* added ProgramManager support for converting a program AST back into a string ([13ba9cb](https://github.com/sonrad10/while.js/commit/13ba9cb690b02bd008f87536377ecd8e7af4a12d))
* added support for converting from a programs-as-data object to a program AST ([e54f8e0](https://github.com/sonrad10/while.js/commit/e54f8e0fe73908583dfb4361bf658d403e15407c))
* added support for converting programs to programs-as-data format ([c82860f](https://github.com/sonrad10/while.js/commit/c82860f03c7efa687a60d2668441e869973590e1))
* added support for displaying programs-as-data objects as strings ([e3dedaa](https://github.com/sonrad10/while.js/commit/e3dedaa213011d2eecac1cc9cfd0aad32fad1997))
* added support for program-as-data tokens in extended WHILE ([e5a5501](https://github.com/sonrad10/while.js/commit/e5a55015d38e9c897e952a70d879e6e3372d81c9))
* added support for replacing macro calls with code ([1008b7e](https://github.com/sonrad10/while.js/commit/1008b7e450cce3437babec4d133243d23803c29c))
* added support for running macros in the interpreter ([de3ddd4](https://github.com/sonrad10/while.js/commit/de3ddd43aa7993c080e899d1f7de819d28a21d83))
* allowed ProgramManager to detect the macros referenced in a program ([1ec2ed9](https://github.com/sonrad10/while.js/commit/1ec2ed9911acef278c56dae9dceea0c618f9e7f0))


### Bug Fixes

* fixed issue where replacing macros would sometimes produce incorrect programs ([3107d87](https://github.com/sonrad10/while.js/commit/3107d872b577184de6624ae3c27bbd3046f51db0))
* removed unnecessary position markers from the AST ([641142a](https://github.com/sonrad10/while.js/commit/641142a5ef20461a1c5e338d64915897dfc1204e))
* stopped incorrectly flagging equality check inside parenthesis as an error ([43610db](https://github.com/sonrad10/while.js/commit/43610dbd74e91bf093e9ea2bc05c274ee7cb7cb7))

## [2.1.0](https://github.com/sonrad10/while.js/compare/v2.0.0...v2.1.0) (2021-07-04)


### Features

* added end positions to linter errors ([7c7af4f](https://github.com/sonrad10/while.js/commit/7c7af4ff6612039ab73cfc0d0692f8d489c1fea1))

## [2.0.0](https://github.com/sonrad10/while.js/compare/v1.2.4...v2.0.0) (2021-07-03)


### ⚠ BREAKING CHANGES

* Made lexer also return a list of error messages
* Replaced lexer and parser global exports with a linter function

### Features

* added a function that performs lexing and parsing in one step ([5af9c4c](https://github.com/sonrad10/while.js/commit/5af9c4c773147beb7793b5721779b630844045a0))
* added interpreter support for extended WHILE ([e7eeb3c](https://github.com/sonrad10/while.js/commit/e7eeb3cb783b3bf9ad8728db1d4fb5919d2edf0a))
* wrote README file ([4a39bc4](https://github.com/sonrad10/while.js/commit/4a39bc46aa064b50d485c6bed24d9d9bbb414049))


### Bug Fixes

* type errors not showing for the program name/io variables ([858ee5f](https://github.com/sonrad10/while.js/commit/858ee5f26016f3d2c7e16212cbf5bbd5856e9fec))

### [1.2.4](https://github.com/sonrad10/while.js/compare/v1.2.3...v1.2.4) (2021-06-16)


### Bug Fixes

* moved cli to its own file to prevent issues when installed as a module ([106e3b4](https://github.com/sonrad10/while.js/commit/106e3b4bc2875e464d613a933964f702ef8d4a8b))

### [1.2.3](https://github.com/sonrad10/while.js/compare/v1.2.2...v1.2.3) (2021-06-16)


### Bug Fixes

* added missing commander dependency ([7f8eb21](https://github.com/sonrad10/while.js/commit/7f8eb21797cb4406e66680ada4c1347241522544))

### [1.2.2](https://github.com/sonrad10/while.js/compare/v1.2.1...v1.2.2) (2021-06-16)


### Bug Fixes

* stopped missing tslib error when trying to run from the command line ([8e4b85c](https://github.com/sonrad10/while.js/commit/8e4b85ca3fd957c8eaf394bbd135e580d9f9055e))

### [1.2.1](https://github.com/sonrad10/while.js/compare/v1.2.0...v1.2.1) (2021-06-16)


### Bug Fixes

* updated dependencies ([944de72](https://github.com/sonrad10/while.js/commit/944de72d2d20b2685be3a4312f740b1567d2c2da))

## [1.2.0](https://github.com/sonrad10/while.js/compare/v1.1.0...v1.2.0) (2021-06-16)


### Features

* added a command line interface for executing a program with the interpreter ([350d805](https://github.com/sonrad10/while.js/commit/350d805eb9cdb40076f465a70fff30ab323c8d2d))
* added an interpreter for pure WHILE ([08435a8](https://github.com/sonrad10/while.js/commit/08435a83d8616e98348c55752e28c1738b7f8b37))

## 1.1.0 (2021-06-11)


### Features

* improved linter messages ([0b7459c](https://github.com/sonrad10/while.js/commit/0b7459cea976764f8877f6bcbeb3c007a7b98afc) through [b101711](https://github.com/sonrad10/while.js/commit/b10171117918f184227ee4f0681fd77d5f33343c))


### Bug Fixes

* added missing package-lock.json file ([28c71d5](https://github.com/sonrad10/while.js/commit/28c71d5f4e13cc82b9b66626e93232c9d308477a))
