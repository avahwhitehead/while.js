import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { AST_ASGN, AST_IDENT_NAME, AST_MACRO, AST_OP, AST_PROG } from "../../src/types/ast";
import { parseProgram } from "../../src/linter";
import ProgramManager from "../../src/utils/ProgramManager";

chai.config.truncateThreshold = 0;

function _expectParseProgram(prog: string): AST_PROG {
	let [ast,err] = parseProgram(prog);
	//Make sure there were no parsing errors
	expect(err).to.deep.equal([]);
	expect(ast.complete).to.be.true;
	//Return the AST
	return ast as AST_PROG;
}

describe('ProgramManager', function () {
	describe('Variables', function () {
		it(`Empty prog`, function () {
			let prog = `
			prog read X {
				
			} write Y
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));
		});
		it(`Assigning`, function () {
			let prog = `
			prog read X {
				A := A;
				Y := X;
				X := Z
			} write Y
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
		it(`Loop/Cond`, function () {
			let prog = `
			prog read X {
				Y := X;
				while Y {
					if hd Y {
						Y := hd Y
					} else {
						Y := tl Y
					};
					Z := cons nil Z
				}
			} write Z
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y', 'Z']));
		});
		it(`Switch`, function () {
			let prog = `
			prog read X {
				switch X {
					case Y:
						A := nil
					case cons nil nil:
						A := cons nil nil
					case <nil.<Z.nil>>:
						A := cons nil cons nil nil
				}
			} write A
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
	});

	describe('reanalyse', function () {
		it(`#setProg`, function () {
			let prog = `
			prog read X {
				Y := cons X X
			} write Y
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));

			let prog1 = `
			prog read A {
				B := cons A A
			} write B
			`;
			let [ast1,err1] = parseProgram(prog1);

			expect(err1).to.deep.equal([]);
			expect(ast1.complete).to.be.true;

			mgr.setProg(ast1 as AST_PROG);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'B']));
		});

		it(`#reanalyse`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := cons X X
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the variables were assigned correctly
			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));

			//Update the AST object
			(ast as AST_PROG).input.value = 'A';
			(ast as AST_PROG).output.value = 'B';
			((ast as AST_PROG).body[0] as AST_ASGN).ident.value = 'B';
			((((ast as AST_PROG).body[0] as AST_ASGN).arg as AST_OP).args[0] as AST_IDENT_NAME).value = 'A';
			((((ast as AST_PROG).body[0] as AST_ASGN).arg as AST_OP).args[1] as AST_IDENT_NAME).value = 'A';

			//The program manager should now be out of date
			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));

			//Trigger a refresh
			mgr.reanalyse();

			//The correct state should be shown
			expect(mgr.variables).to.deep.equal(new Set(['A', 'B']));
		});
	});

	describe('macros', function () {
		it(`single macro`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <add> cons X X
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1]]));
		});

		it(`should update correctly after the AST is changed`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <add> cons X X
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1]]));

			//Update the AST object
			(((ast as AST_PROG).body[0] as AST_ASGN).arg as AST_MACRO).program = 'sub';

			//The program manager should now be out of date
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));

			//Trigger a refresh
			mgr.reanalyse();

			//Check that the new macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['sub']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['sub', 1]]));
		});

		it(`should register multiple macros in the same program`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <add> cons X X;
				Z := <sub> cons Y X
			} write Z
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add', 'sub']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1], ['sub', 1]]));
		});

		it(`should register multiple macros with the same name`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <add> cons X X;
				while X {
					X := tl X;
					Y := <add> cons X X
				}
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 2]]));
		});

		it(`should register nested nested macros`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <add> cons X (<add> cons X X)
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the variables were assigned correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 2]]));
		});
	});

	describe('rename variables', function () {
		it(`should rename an internal root variable`, function () {
			//Get an AST
			let ast: AST_PROG = _expectParseProgram(`
			prog read A {
				B := hd A;
				Z := tl A;
				B := cons B B;
				Z := cons Z Z;
				D := cons B Z
			} write D
			`);

			let mgr: ProgramManager = new ProgramManager(ast);

			mgr.renameVariable('Z', 'C');

			//Get an AST
			let expected: AST_PROG = _expectParseProgram(`
			prog read A {
				B := hd A;
				C := tl A;
				B := cons B B;
				C := cons C C;
				D := cons B C
			} write D
			`);

			expect(mgr.prog).to.deep.equal(expected);
		});

		it(`should rename an IO variable`, function () {
			//Get an AST
			let ast: AST_PROG = _expectParseProgram(`
			prog read A {
				B := cons A A;
				C := B
			} write C
			`);

			let mgr: ProgramManager = new ProgramManager(ast);

			mgr.renameVariable('A', 'X');

			//Get an AST
			let expected: AST_PROG = _expectParseProgram(`
			prog read X {
				B := cons X X;
				C := B
			} write C
			`);

			expect(mgr.prog).to.deep.equal(expected);

			mgr.renameVariable('C', 'Z');

			//Get an AST
			let expected2: AST_PROG = _expectParseProgram(`
			prog read X {
				B := cons X X;
				Z := B
			} write Z
			`);

			expect(mgr.prog).to.deep.equal(expected2);
		});
	});

	describe('replace macros', function () {
		it(`should replace a basic macro`, function () {
			//Get an AST
			let [ast,err] = parseProgram(`
			prog read X {
				Y := <macro> X
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;
			//Get an AST
			let [macroAst,macroErr] = parseProgram(`
			macro read X {
				X := cons X X;
				X := cons X X;
				Y := X
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(macroErr).to.deep.equal([]);
			expect(macroAst.complete).to.be.true;

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['macro']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['macro', 1]]));

			mgr.replaceMacro(macroAst as AST_PROG);

			//Get an AST
			let [expectedAst,expectedErr] = parseProgram(`
			prog read X {
				A := X;
				A := cons A A;
				A := cons A A;
				B := A;
				Y := B
			} write Y
			`);
			//Make sure there were no parsing errors
			expect(expectedErr).to.deep.equal([]);
			expect(expectedAst.complete).to.be.true;

			expect(mgr.prog).to.deep.equal(expectedAst);
		});
	});

	describe('display program', function () {
		it(`should display an empty program`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
			} write X
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				``,
				`} write X`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});

		it(`should display a simple conditional program`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
				if X {
					Y := 1
				} else {
					Y := 0
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`	if X {`,
				`		Y := cons nil nil`,
				`	} else {`,
				`		Y := nil`,
				`	}`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});

		it(`should hide empty else statements`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
				Y := 0;
				if X {
					Y := 1
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`	Y := nil;`,
				`	if X {`,
				// `		Y := <nil.nil>`,
				`		Y := cons nil nil`,
				`	}`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});

		it(`should display numbers as trees`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
				Y := 0;
				Y := 1;
				Y := 2;
				Y := 3;
				Y := 4;
				Y := 5
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`	Y := nil;`,
				`	Y := cons nil nil;`,
				`	Y := cons nil cons nil nil;`,
				`	Y := cons nil cons nil cons nil nil;`,
				`	Y := cons nil cons nil cons nil cons nil nil;`,
				`	Y := cons nil cons nil cons nil cons nil cons nil nil`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});

		it(`should display loops`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
				Z := nil;
				while X {
					Y := hd X;
					X := tl X;
					if Y {
						Z := cons nil Z
					} else {}
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`	Z := nil;`,
				`	while X {`,
				`		Y := hd X;`,
				`		X := tl X;`,
				`		if Y {`,
				`			Z := cons nil Z`,
				`		}`,
				`	}`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});

		it(`should display macros`, function () {
			//Get an AST
			let ast = _expectParseProgram(`
			prog read X {
				while X {
					Y := <add> cons X Y
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast as AST_PROG);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`	while X {`,
				`		Y := <add> cons X Y`,
				`	}`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(mgr.displayProgram()).to.deep.equal(expected);
		});
	})
});