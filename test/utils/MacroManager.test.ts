import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { MacroManager } from "../../src";
import { expectParseProgram } from "../utils";
import { AST_PROG } from "../../src/types/ast";

chai.config.truncateThreshold = 0;

describe('MacroManager', function () {
	describe('Constructor', function () {
		it(`No args`, function () {
			let mgr: MacroManager = new MacroManager();
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.macros).to.deep.equal([]);
		});
		it(`Constructor prog arg only should be equivalent to #.register`, function () {
			let prog = expectParseProgram(`
				prog read X {
					Y := cons X X
				} write Y
			`);
			let mgr1: MacroManager = new MacroManager();
			let mgr: MacroManager = new MacroManager(prog);
			mgr1.register(prog);

			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
			expect(mgr.macros).to.deep.equal([{n: 'prog', p: prog}]);
		});
		it(`Constructor prog+name args should be equivalent to #.register`, function () {
			let prog = expectParseProgram(`
				prog read X {
					Y := cons X X
				} write Y
			`);
			let mgr1: MacroManager = new MacroManager();
			let mgr: MacroManager = new MacroManager(prog, 'p');
			mgr1.register(prog, 'p');

			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
			expect(mgr.macros).to.deep.equal([{n: 'p', p: prog}]);
		});
	});

	describe('Default', function () {
		it(`Empty manager should have no dependencies`, function () {
			let mgr: MacroManager = new MacroManager();
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.macros.length).to.equal(0);
			expect(mgr.unregisteredMacros.length).to.equal(0);
		});

		it(`Prog with no macros should have no dependencies`, function () {
			let ast = expectParseProgram(`
			prog read X {
				Y := cons X X
			} write Y`);
			let mgr: MacroManager = new MacroManager(ast);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:ast}]);
			expect(mgr.unregisteredMacros.length).to.equal(0);
		});

		it(`Prog with 1 macro layer should have only those dependencies`, function () {
			let ast = expectParseProgram(`
			prog read X {
				Y := <double> X
			} write Y`);
			let mgr: MacroManager = new MacroManager(ast);
			expect(mgr.hasUnregistered).to.be.true;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:ast}]);
			expect(mgr.unregisteredMacros).to.deep.equal(['double']);

			const progDouble = expectParseProgram(`
			double read X {
				Y := cons X X
			} write Y
			`);
			mgr.register(progDouble);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:ast}, {n:'double', p:progDouble}]);
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});

		it(`Nested macros`, function () {
			const progRoot = expectParseProgram(`
			prog read X {
				Y := <quad> X
			} write Y`);
			const progQuad = expectParseProgram(`
			prog read X {
				Y := <double> X;
				Y := <double> Y
			} write Y`);
			const progDouble = expectParseProgram(`
			double read X {
				Y := cons X X
			} write Y`);

			let mgr: MacroManager = new MacroManager(progRoot);
			expect(mgr.hasUnregistered).to.be.true;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:progRoot}]);
			expect(mgr.unregisteredMacros).to.deep.equal(['quad']);

			mgr.register(progQuad, 'quad');
			expect(mgr.hasUnregistered).to.be.true;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:progRoot}, {n:'quad', p:progQuad}]);
			expect(mgr.unregisteredMacros).to.deep.equal(['double']);

			mgr.register(progDouble);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.macros).to.deep.equal([{n:'prog', p:progRoot}, {n:'quad', p:progQuad}, {n:'double', p:progDouble}]);
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});
	});

	describe('Autoregister', function () {
		const progMap: Map<string, AST_PROG> = new Map<string, AST_PROG>();

		progMap.set('baseProg', expectParseProgram(`
		baseProg read X {
			Y := <macro1> X;
			Y := <mymacro> X
		} write Y`));
		progMap.set('mymacro', expectParseProgram(`
		mymacro read X {
			Y := <macro1> X;
			Y := <macro1> X
		} write Y`));

		progMap.set('macro4', expectParseProgram(`
		macro3 read X {
			Y := <macro3> X;
			Y := <macro2> X
		} write Y`));
		progMap.set('macro3', expectParseProgram(`
		thirdMacro read X {
			Y := <macro2> X
		} write Y`));
		progMap.set('macro2', expectParseProgram(`
		macro2 read X {
			Y := <macro1> X
		} write Y`));
		progMap.set('macro1', expectParseProgram(`
		macro1 read X {
			Y := cons X X
		} write Y`));


		it(`Empty manager should register no macros`, function () {
			let mgr: MacroManager = new MacroManager();
			let counter: number = 0;
			mgr.autoRegister((name) => {
				counter++;
				return progMap.get(name)!;
			});

			expect(counter).to.equal(0);
			expect(mgr.macros).to.deep.equal([]);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});

		it(`Prog with no macros should register no dependencies`, function () {
			let mgr: MacroManager = new MacroManager(progMap.get('macro1')!);
			let counter: number = 0;
			mgr.autoRegister((name) => {
				counter++;
				return progMap.get(name)!;
			});

			expect(counter).to.equal(0);
			expect(mgr.macros).to.deep.equal([{n:'macro1', p:progMap.get('macro1')!}]);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});

		it(`Prog with 1 macro layer should register only those dependencies`, function () {
			let mgr: MacroManager = new MacroManager(progMap.get('macro2')!);
			let counter: number = 0;
			mgr.autoRegister((name) => {
				counter++;
				return progMap.get(name)!;
			});

			expect(counter).to.equal(1);
			expect(mgr.macros).to.deep.equal([
				{n:'macro2', p:progMap.get('macro2')!},
				{n:'macro1', p:progMap.get('macro1')!}
			]);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});

		it(`Prog with 1 macro layer should register only those dependencies`, function () {
			let mgr: MacroManager = new MacroManager(progMap.get('baseProg')!);
			let counter: number = 0;
			mgr.autoRegister((name) => {
				counter++;
				return progMap.get(name)!;
			});

			expect(counter).to.equal(2);
			expect(mgr.macros).to.deep.equal([
				{n:'baseProg', p:progMap.get('baseProg')!},
				{n:'macro1', p:progMap.get('macro1')!},
				{n:'mymacro', p:progMap.get('mymacro')!},
			]);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});

		it(`Nested macros should all be registered`, function () {
			let mgr: MacroManager = new MacroManager(progMap.get('macro4')!, 'macro4');
			let counter: number = 0;
			mgr.autoRegister((name) => {
				counter++;
				return progMap.get(name)!;
			});

			expect(mgr.macros).to.deep.equal([
				{n:'macro4', p:progMap.get('macro4')!},
				{n:'macro3', p:progMap.get('macro3')!},
				{n:'macro2', p:progMap.get('macro2')!},
				{n:'macro1', p:progMap.get('macro1')!},
			]);
			expect(counter).to.equal(3);
			expect(mgr.hasUnregistered).to.be.false;
			expect(mgr.unregisteredMacros).to.deep.equal([]);
		});
	});
});
