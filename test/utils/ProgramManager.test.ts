import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { AST_ASGN, AST_IDENT_NAME, AST_MACRO, AST_OP, AST_PROG } from "../../src/types/ast";
import ProgramManager from "../../src/utils/ProgramManager";
import astEquals from "../../src/tools/astEquals";
import { a, expectParseProgram, tn } from "../utils";
import { BinaryTree } from "@whide/tree-lang";
import { Interpreter } from "../../src";

chai.config.truncateThreshold = 0;

describe('ProgramManager', function () {
	describe('Variables', function () {
		it(`Empty prog`, function () {
			let ast = expectParseProgram(`
			prog read X {
				
			} write Y
			`);
			let mgr = new ProgramManager(ast);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));
		});
		it(`Assigning`, function () {
			let ast = expectParseProgram(`
			prog read X {
				A := A;
				Y := X;
				X := Z
			} write Y
			`);
			let mgr = new ProgramManager(ast);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
		it(`Loop/Cond`, function () {
			let ast = expectParseProgram(`
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
			`);

			let mgr = new ProgramManager(ast);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y', 'Z']));
		});
		it(`Switch`, function () {
			let ast = expectParseProgram(`
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
			`);
			let mgr = new ProgramManager(ast);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
	});

	describe('reanalyse', function () {
		it(`#setProg`, function () {
			let ast = expectParseProgram(`
			prog read X {
				Y := cons X X
			} write Y
			`);
			let mgr = new ProgramManager(ast);

			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));

			let ast1 = expectParseProgram(`
			prog read A {
				B := cons A A
			} write B
			`);

			mgr.setProg(ast1);

			expect(mgr.variables).to.deep.equal(new Set(['A', 'B']));
		});

		it(`#reanalyse`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons X X
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the variables were assigned correctly
			expect(mgr.variables).to.deep.equal(new Set(['X', 'Y']));

			//Update the AST object
			ast.input.value = 'A';
			ast.output.value = 'B';
			(ast.body[0] as AST_ASGN).ident.value = 'B';
			(((ast.body[0] as AST_ASGN).arg as AST_OP).args[0] as AST_IDENT_NAME).value = 'A';
			(((ast.body[0] as AST_ASGN).arg as AST_OP).args[1] as AST_IDENT_NAME).value = 'A';

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
			let ast = expectParseProgram(`
			prog read X {
				Y := <add> cons X X
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1]]));
		});

		it(`should update correctly after the AST is changed`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := <add> cons X X
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1]]));

			//Update the AST object
			((ast.body[0] as AST_ASGN).arg as AST_MACRO).program = 'sub';

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
			let ast = expectParseProgram(`
			prog read X {
				Y := <add> cons X X;
				Z := <sub> cons Y X
			} write Z
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add', 'sub']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 1], ['sub', 1]]));
		});

		it(`should register multiple macros with the same name`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := <add> cons X X;
				while X {
					X := tl X;
					Y := <add> cons X X
				}
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 2]]));
		});

		it(`should register nested nested macros`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := <add> cons X (<add> cons X X)
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the variables were assigned correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['add']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['add', 2]]));
		});

		describe(`macro semantics`, function () {
			describe(`equals`, function () {
				//Get an AST
				let ast: AST_PROG = expectParseProgram(`
				myEquals read input {
					output := <isEqual> input
				} write output
				`);

				//Create a ProgramManager from the AST
				let mgr = new ProgramManager(ast as AST_PROG);
				mgr.replaceMacro(astEquals, 'isEqual');

				const comparisons: [string, [BinaryTree, BinaryTree], boolean][] = [
					['nil = nil',
						[null, null],
						true
					],
					['20 = 20',
						[tn(20), tn(20)],
						true
					],
					['nil = 2',
						[null, tn(2)],
						false
					],
					['[1, [5, 4, 2], 4] = [1, [5, 4, 2], 4]',
						[
							a(1, a(5, 4, 2), 1),
							a(1, a(5, 4, 2), 1)
						],
						true
					],
					['[1, [5, 4, 2], 4] = [1, [5, 3, 2], 4]',
						[
							a(1, a(5, 4, 2), 1),
							a(1, a(5, 3, 2), 1)
						],
						false
					],
					['[1, [5, 4, 2], 4] = [0, [5, 4, 2], 4]',
						[
							a(1, a(5, 4, 2), 1),
							a(0, a(5, 4, 2), 1)
						],
						false
					],
				];

				for (let [name, [a, b], expected] of comparisons) {
					it(`${name} should be ${expected}`, function () {
						let interpreter: Interpreter = new Interpreter(
							mgr.prog,
							{left: a, right: b}
						);

						let result: BinaryTree = interpreter.run();

						let expectedTree: BinaryTree = expected ? {left: null, right: null} : null;

						//Expect this output
						expect(result).to.deep.equal(expectedTree);
					});
				}
			});
		});
	});

	describe('rename variables', function () {
		it(`should rename an internal root variable`, function () {
			//Get an AST
			let ast: AST_PROG = expectParseProgram(`
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
			let expected: AST_PROG = expectParseProgram(`
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
			let ast: AST_PROG = expectParseProgram(`
			prog read A {
				B := cons A A;
				C := B
			} write C
			`);

			let mgr: ProgramManager = new ProgramManager(ast);

			mgr.renameVariable('A', 'X');

			//Get an AST
			let expected: AST_PROG = expectParseProgram(`
			prog read X {
				B := cons X X;
				C := B
			} write C
			`);

			expect(mgr.prog).to.deep.equal(expected);

			mgr.renameVariable('C', 'Z');

			//Get an AST
			let expected2: AST_PROG = expectParseProgram(`
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
			let ast = expectParseProgram(`
			prog read X {
				Y := <macro> X
			} write Y
			`);
			//Get an AST
			let macroAst = expectParseProgram(`
			macro read X {
				X := cons X X;
				X := cons X X;
				Y := X
			} write Y
			`);
			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

			//Check that the macros were read correctly
			expect(new Set(mgr.macros)).to.deep.equal(new Set(['macro']));
			expect(mgr.macroCounts).to.deep.equal(new Map([['macro', 1]]));

			mgr.replaceMacro(macroAst);

			//Get an AST
			let expectedAst = expectParseProgram(`
			prog read X {
				A := X;
				A := cons A A;
				A := cons A A;
				B := A;
				Y := B
			} write Y
			`);
			expect(mgr.prog).to.deep.equal(expectedAst);
		});
	});

	describe('display program', function () {
		it(`should display an empty program`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
			} write X
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

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
			let ast = expectParseProgram(`
			prog read X {
				if X {
					Y := 1
				} else {
					Y := 0
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

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
			let ast = expectParseProgram(`
			prog read X {
				Y := 0;
				if X {
					Y := 1
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

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
			let ast = expectParseProgram(`
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
			let mgr = new ProgramManager(ast);

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
			let ast = expectParseProgram(`
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
			let mgr = new ProgramManager(ast);

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
			let ast = expectParseProgram(`
			prog read X {
				while X {
					Y := <add> cons X Y
				}
			} write Y
			`);

			//Create a ProgramManager from the AST
			let mgr = new ProgramManager(ast);

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

	describe('convert to pure', function () {
		it(`should convert false to nil`, function () {
			//Create a ProgramManager for the program
			let mgr = new ProgramManager(
				expectParseProgram(`
				prog read X {
					Y := false
				} write Y
				`)
			);
			//Convert the program to pure WHILE
			mgr.toPure();

			//The expected pure AST
			let expected = expectParseProgram(`
			prog read X {
				Y := nil
			} write Y
			`);
			//Expect this output
			expect(mgr.prog).to.deep.equal(expected);
		});

		it(`should convert true to cons nil nil`, function () {
			//Create a ProgramManager for the program
			let mgr = new ProgramManager(
				expectParseProgram(`
				prog read X {
					Y := true
				} write Y
				`)
			);
			//Convert the program to pure WHILE
			mgr.toPure();

			//The expected pure AST
			let expected = expectParseProgram(`
			prog read X {
				Y := cons nil nil
			} write Y
			`);
			//Expect this output
			expect(mgr.prog).to.deep.equal(expected);
		});

		describe(`Convert binary tree literals to cons operations`, function () {
			it(`should convert empty binary trees to nil`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := 0
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := nil
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert numbers to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := 5
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons nil (cons nil (cons nil (cons nil (cons nil nil))))
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});
		});

		describe(`Convert lists to cons operations`, function () {
			it(`should convert an empty list to nil`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := []
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := nil
				} write Y
				`);

				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert a list with 1 element to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := [3]
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons (cons nil cons nil cons nil nil) nil
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert a list with multiple elements to nested cons with trailing nil`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := [3, <<<nil.nil>.<nil.nil>>.nil>]
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons (cons nil cons nil cons nil nil) cons (cons (cons (cons nil nil) (cons nil nil)) nil) nil
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});
		});

		describe(`Convert expression trees to cons operations`, function () {
			it(`should convert a simple tree to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := <nil.nil>
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons nil nil
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert a single layer tree to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := <2.nil>
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons (cons nil cons nil nil) nil
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert nested trees to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := <<nil.<nil.nil>>.<nil.nil>>
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons (cons nil (cons nil nil)) (cons nil nil)
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert nested trees to cons`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := <nil.<nil.<nil.<nil.<nil.nil>>>>>
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons nil (cons nil (cons nil (cons nil (cons nil nil))))
				} write Y
				`);
				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});
		});

		describe(`Convert switches to nested ifs`, function () {
			it(`should convert empty switch to empty if`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						switch X { }
					} write X
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if nil {} else {}
				} write X
				`);

				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert empty switch's default to execute unconditionally`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						switch X {
							default:
								X := cons nil nil
						}
					} write X
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if nil { } else {
						X := cons nil nil
					}
				} write X
				`);

				//Expect this output
				expect(mgr.prog).to.deep.equal(expected);
			});

			it(`should convert switches to nested ifs`, function () {
				//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						switch X {
							case 2:
								Z := nil
							case 3:
								Z := cons nil nil
							default:
								Z := cons nil cons nil nil
						}
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if <A> cons X (cons nil cons nil nil) {
						Z := nil
					} else {
						if <A> cons X (cons nil cons nil cons nil nil) {
							Z := cons nil nil
						} else {
							Z := cons nil cons nil nil
						}
					}
				} write Z
				`);
				let expectedManager = new ProgramManager(expected);
				expectedManager.replaceMacro(astEquals, 'A');
				expectedManager.replaceMacro(astEquals, 'A');
			});
		});

		describe(`Replace equals operator with the macro code`, function () {
			it(`should replace equals operator in a condition`, function () {//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						if X = nil {
							Y := cons nil nil
						} else {
							Y := nil
						}
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if (<equality> cons X nil) {
						Y := cons nil nil
					} else {
						Y := nil
					}
				} write Y
				`);
				let exprManager = new ProgramManager(expected);
				exprManager.replaceMacro(astEquals, 'equality');

				//Expect this output
				expect(mgr.prog).to.deep.equal(exprManager.prog);
			});

			it(`should replace equals operator in a statement`, function () {//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						Y := <X=nil.nil>
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					Y := cons (<equality> cons X nil) nil
				} write Y
				`);
				let exprManager = new ProgramManager(expected);
				exprManager.replaceMacro(astEquals, 'equality');

				//Expect this output
				expect(mgr.prog).to.deep.equal(exprManager.prog);
			});

			it(`should replace equals operator in a switch input`, function () {//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						switch (X = cons nil nil) {
							case nil:
								Y := nil
							case cons nil nil:
								Y := cons nil nil
						}
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if (<equality> cons (<equality> cons X cons nil nil) nil) {
						Y := nil
					} else {
						if (<equality> cons (<equality> cons X cons nil nil) (cons nil nil)) {
							Y := cons nil nil
						}
					}
				} write Y
				`);
				let exprManager = new ProgramManager(expected);
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');

				//Expect this output
				expect(mgr.prog).to.deep.equal(exprManager.prog);
			});

			it(`should replace equals operator in a switch condition`, function () {//Create a ProgramManager for the program
				let mgr = new ProgramManager(
					expectParseProgram(`
					prog read X {
						switch X {
							case nil:
								Y := nil
							case X = X:
								Y := cons nil nil
						}
					} write Y
					`)
				);
				//Convert the program to pure WHILE
				mgr.toPure();

				//The expected pure AST
				let expected = expectParseProgram(`
				prog read X {
					if (<equality> cons X nil) {
						Y := nil
					} else {
						if (<equality> cons X (<equality> cons X X)) {
							Y := cons nil nil
						}
					}
				} write Y
				`);
				let exprManager = new ProgramManager(expected);
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');
				exprManager.replaceMacro(astEquals, 'equality');

				//Expect this output
				expect(mgr.prog).to.deep.equal(exprManager.prog);
			});
		});
	});
});
