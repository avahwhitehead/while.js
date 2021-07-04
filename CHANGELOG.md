# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
