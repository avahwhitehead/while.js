import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { Interpreter } from "../../src";
import { a, t, tn } from "../utils";
import EQUALS_AST from "../../src/tools/astEquals";
import { BinaryTree } from "@whide/tree-lang";

chai.config.truncateThreshold = 0;

const FALSE = null;
const TRUE = t(null, null);

//TODO: Write more tests

function _duplicate(t: BinaryTree): BinaryTree {
	return {
		left: t,
		right: t,
	}
}

describe('Equality Macro', function () {
	describe('Same', function () {
		it(`nil`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, _duplicate(null));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(TRUE);
		});
		it(`<nil.nil>`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, _duplicate(tn(1)));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(TRUE);
		});
		it(`9`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, _duplicate(tn(9)));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(TRUE);
		});
		it(`[5, 6, 7, 8]`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, _duplicate(a(5, 6, 7, 8)));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(TRUE);
		});
		it(`<<<nil.nil>.<nil.nil>>.<<nil.nil>.<nil.nil>>>`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, _duplicate(t(t(t(null, null), t(null, null)), t(t(null, null), t(null, null)))));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(TRUE);
		});
	});

	describe('Different', function () {
		it(`nil | 1`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, t(null, tn(1)));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(FALSE);
		});
		it(`1 | nil`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, t(tn(1), null));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(FALSE);
		});
		it(`[<<nil.nil>.nil>] | [<nil.nil>]`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, t(a(t(t(null, null), null)), a(t(null, null))));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(FALSE);
		});
		it(`[<<nil.nil>.nil>] | [<nil.<nil.nil>>]`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, t(a(t(t(null, null), null)), a(t(null, t(null, null)))));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(FALSE);
		});
		it(`[5, 6, 8, 8]`, function () {
			let interpreter: Interpreter = new Interpreter(EQUALS_AST, t(a(5, 6, 7, 8), a(5, 6, 8, 8)));
			let actual: BinaryTree = interpreter.run();

			expect(actual).to.deep.equal(FALSE);
		});
	});
});
