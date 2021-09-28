import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import Interpreter from "../../src/run/Interpreter";
import { a, expectParseProgram, t, tn, treeToString } from "../utils";
import astEquals from "../../src/tools/astEquals";
import { BinaryTree } from "@whide/tree-lang";

chai.config.truncateThreshold = 0;

const prog_ident = `
ident read X {

} write X
`;

const prog_empty = `
empty read X {

} write Y
`;

const prog_reverse = `
reverse read X {
	while X {
		Y := cons (hd X) Y;
		X := tl X
	}
} write Y
`;

const prog_concat = `
concat read XY {
	X := hd XY;
	Y := tl XY;
	while X {
		revX := cons (hd X) revX;
		X := tl X
	};
	while revX {
		Y := cons (hd revX) Y;
		revX := tl revX
	}
} write Y
`;

const prog_test = `
test read X {
	if tl tl X {
		Y := nil
	} else {
		if tl X {
			Y := cons nil nil
		} else {
			Y := cons nil cons nil nil
		}
	}
} write Y
`;

const prog_sum = `
sum read X {
	out := nil;
	while X {
		Y := hd X;
		while Y {
			out := cons nil out;
			Y := tl Y
		};
		X := tl X
	}
} write out
`;

const prog_many_cons = `
many_cons read X {
	X := cons cons nil cons nil nil cons nil nil
} write X
`;

const prog_switch = `
prog read X {
	switch X {
		case nil:
			Y := 1
		case cons nil nil:
			Y := 2
		case cons nil cons nil nil:
			Y := 3
		case cons nil cons nil cons nil nil:
			Y := 4
		default:
			Y := 0
	}
} write Y
`;

const prog_switch2 = `
prog read X {
	switch X {
		case nil:
			Y := 1
		case <nil.nil>:
			Y := 2
		case <nil.<nil.nil>>:
			Y := 3
		case <nil.<nil.<nil.nil>>>:
			Y := 4
		default:
			Y := 0
	}
} write Y
`;

const prog_switch3 = `
prog read X {
	switch X {
		case 0:
			Y := 1
		case 1:
			Y := 2
		case 2:
			Y := 3
		case 3:
			Y := 4
		default:
			Y := 0
	}
} write Y
`;

const prog_equals = `
eq read X {
	isEq := false;
	if (hd X) = (tl X) {
		isEq := true
	}
} write isEq
`;

const prog_equals1 = `
eq read X {
	isEq := hd X = tl X
} write isEq
`;

describe('Interpreter', function () {
	describe('prog_ident', function () {
		for (let tree of [null, tn(5), t(t(null, null), t(null, null))]) {
			it(treeToString(tree), function () {
				let res = Interpreter.parse(prog_ident, tree);
				expect(res.success).to.be.true;
				let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
				expect(
					interpreter.run()
				).to.deep.equal(
					tree
				);
			});
		}
	});

	describe('prog_empty', function () {
		it('nil => nil', function () {
			let res = Interpreter.parse(prog_empty, null);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(null);
		});
		it('<nil.nil> => nil', function () {
			let res = Interpreter.parse(prog_empty, t(null, null));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(null);
		});
		it('<<nil.nil>.<nil.nil>> => nil', function () {
			let res = Interpreter.parse(prog_empty, t(t(null, null), t(null, null)));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(null);
		});
	});

	describe('prog_reverse', function () {
		it('nil => nil', function () {
			let res = Interpreter.parse(prog_reverse, null);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				null
			);
		});
		it('[1,2,3] => [3,2,1]', function () {
			let res = Interpreter.parse(prog_reverse, a(1, 2, 3));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				a(3, 2, 1)
			);
		});
	});

	describe('prog_concat', function () {
		it('<3.4> => 7', function () {
			let res = Interpreter.parse(prog_concat, t(tn(3), tn(4)));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				tn(7)
			);
		});
	});

	describe('prog_test', function () {
		it('0 => 2', function () {
			let res = Interpreter.parse(prog_test, tn(0));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(tn(2));
		});
		it('1 => 2', function () {
			let res = Interpreter.parse(prog_test, tn(1));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(tn(2));
		});
		it('2 => 1', function () {
			let res = Interpreter.parse(prog_test, tn(2));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(tn(1));
		});
		it('3 => 0', function () {
			let res = Interpreter.parse(prog_test, tn(3));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(tn(0));
		});
		it('4 => 0', function () {
			let res = Interpreter.parse(prog_test, tn(4));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(tn(0));
		});
	});

	describe('prog_sum', function () {
		it('[] => 0', function () {
			let res = Interpreter.parse(prog_sum, null);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				null
			);
		});
		it('[3,3] => 6', function () {
			let res = Interpreter.parse(prog_sum, a(3, 3));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				tn(6)
			);
		});
		it('[5,4,3,2,1] => 15', function () {
			let res = Interpreter.parse(prog_sum, a(5, 4, 3, 2, 1));
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				tn(15)
			);
		});
	});

	describe('prog_many_cons', function () {
		it('any => <<nil.<nil.nil>>.<nil.nil>>', function () {
			let res = Interpreter.parse(prog_many_cons, null);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				t(t(null,t(null,null)), t(null,null))
			);
		});
	});

	describe('switch', function () {
		for (let [name,prog] of [
			['prog_switch',prog_switch],
			['prog_switch2',prog_switch2],
			['prog_switch3',prog_switch3]
		]) {
			describe(name, function () {
				it('0 => 1', function () {
					let res = Interpreter.parse(prog, null);
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(1)
					);
				});
				it('1 => 2', function () {
					let res = Interpreter.parse(prog, tn(1));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(2)
					);
				});
				it('2 => 3', function () {
					let res = Interpreter.parse(prog, tn(2));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(3)
					);
				});
				it('3 => 4', function () {
					let res = Interpreter.parse(prog, tn(3));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(4)
					);
				});
				it('4 => 0', function () {
					let res = Interpreter.parse(prog, tn(4));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(0)
					);
				});
			});
		}
	});

	describe('equality', function () {
		for (let [name,prog] of [
			['prog_equals',prog_equals],
			['prog_equals1',prog_equals1]
		]) {
			describe(name, function () {
				it('<nil.nil> => true', function () {
					let res = Interpreter.parse(prog, t(null, null));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(1)
					);
				});
				it('<<nil.nil>.<nil.nil>> => true', function () {
					let res = Interpreter.parse(prog, t(t(null, null), t(null, null)));
					expect(res.success).to.be.true;
					let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
					expect(
						interpreter.run()
					).to.deep.equal(
						tn(1)
					);
				});
			});
			it('<<nil.nil>.nil> => false', function () {
				let res = Interpreter.parse(prog, t(t(null, null), null));
				expect(res.success).to.be.true;
				let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
				expect(
					interpreter.run()
				).to.deep.equal(
					tn(0)
				);
			});
			it('<nil.<nil.nil>> => false', function () {
				let res = Interpreter.parse(prog, t(null, t(null, null)));
				expect(res.success).to.be.true;
				let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
				expect(
					interpreter.run()
				).to.deep.equal(
					tn(0)
				);
			});
		}
	});

	describe('hd fallback', function () {
		it('hd nil => nil', function () {
			let res = Interpreter.parse(
				`prog read X { X := hd nil } write X`,
				t(t(null, null), t(null, null))
			);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				null
			);
		});
	});

	describe('tl fallback', function () {
		it('tl nil => nil', function () {
			let res = Interpreter.parse(
				`prog read X { X := tl nil } write X`,
				t(t(null, null), t(null, null))
			);
			expect(res.success).to.be.true;
			let interpreter = (res as {success: true,interpreter: Interpreter}).interpreter;
			expect(
				interpreter.run()
			).to.deep.equal(
				null
			);
		});
	});

	describe('macro test', function () {
		it(`should correctly evaluate a basic macro`, function () {
			//Root program AST
			let ast = expectParseProgram(`
			prog read X {
				Y := <double> X
			} write Y
			`);
			//Macro AST
			let macroAst = expectParseProgram(`
			double read X {
				Y := cons X X
			} write Y
			`);

			const tests = [
				tn(4),
				null,
				a(a(t(null, null), null))
			];
			for (let tree of tests) {
				let interpreter: Interpreter = new Interpreter(ast, tree, {macros: [macroAst]});
				expect(interpreter.run()).to.deep.equal(t(tree, tree));
			}
		});

		describe(`equality macro`, function () {
			//Root program AST
			let ast = expectParseProgram(`
			prog read X {
				Y := <equals> X
			} write Y
			`);

			const trueTests: [BinaryTree,BinaryTree,string][] = [
				[null, null, 'null'],
				[tn(5), tn(5), '5'],
				[a(5, 2, 0), t(5, a(2, 0)), '[5, 2, 0]'],
			];
			for (let [t1,t2,name] of trueTests) {
				it(`${name} expects true`, function () {
					let interpreter: Interpreter = new Interpreter(ast, t(t1, t2), {macros: [{n:'equals', p:astEquals}]});
					expect(interpreter.run()).to.deep.equal(tn(1));
				});
			}
			const falseTests: [BinaryTree,BinaryTree,string][] = [
				[null, tn(1), 'null = 1'],
				[tn(6), tn(5), '6 = 5'],
				[a(5, 2, 0), a(5, 2), '[5, 2, 0] = [5, 2]'],
			];
			for (let [t1,t2,name] of falseTests) {
				it(`${name} expects false`, function () {
					let interpreter: Interpreter = new Interpreter(ast, t(t1, t2), {macros: [{n:'equals', p:astEquals}]});
					expect(interpreter.run()).to.deep.equal(tn(0));
				});
			}
		});
	});
});

describe('Interpreter.treeEquals', function () {
	describe('equal trees', function () {
		it(`nil = nil`, function () {
			expect(
				Interpreter.treeEquals(null, null)
			).to.be.true;
		});
		it(`<nil.nil> = <nil.nil>`, function () {
			expect(
				Interpreter.treeEquals(t(null, null), t(null, null))
			).to.be.true;
		});
		it(`4 = 4`, function () {
			expect(
				Interpreter.treeEquals(tn(4), tn(4))
			).to.be.true;
		});
		it(`10 = 10`, function () {
			expect(
				Interpreter.treeEquals(tn(10), tn(10))
			).to.be.true;
		});
	});

	describe('different trees', function () {
		it(`nil != <nil.nil>`, function () {
			expect(
				Interpreter.treeEquals(t(null, null), null)
			).to.be.false;
		});
		it(`<nil.nil> != nil`, function () {
			expect(
				Interpreter.treeEquals(null, t(null, null))
			).to.be.false;
		});
		it(`4 != 5`, function () {
			expect(
				Interpreter.treeEquals(tn(4), tn(5))
			).to.be.false;
		});
		it(`5 != 4`, function () {
			expect(
				Interpreter.treeEquals(tn(5), tn(4))
			).to.be.false;
		});
		it(`10 != nil`, function () {
			expect(
				Interpreter.treeEquals(tn(10), null)
			).to.be.false;
		});
		it(`nil != 10`, function () {
			expect(
				Interpreter.treeEquals(null, tn(10))
			).to.be.false;
		});
	});
});