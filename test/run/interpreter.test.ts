import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import Interpreter from "../../src/run/Interpreter";
import { a, t, tn, treeToString } from "../utils";

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

//<<nil.<nil.nil>>.<nil.nil>
const prog_many_cons = `
many_cons read X {
	X := cons cons nil cons nil nil cons nil nil
} write X
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
		it('any => <<nil.<nil.nil>>.<nil.nil>', function () {
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
});
