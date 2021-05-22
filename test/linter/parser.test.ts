import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import parser from "../../src/linter/parser";
import lexer, {
	EXPR_TOKEN,
	EXPR_TYPE,
	IDENT_TYPE, OP_TOKEN, OP_TYPE,
	SYMBOL_TOKEN,
	SYMBOL_TYPE, TKN_CONS, TKN_TL,
	UNKNOWN_TYPE
} from "../../src/linter/lexer";
import { AST_PROG } from "../../src/types/ast";

chai.config.truncateThreshold = 0;

function sym(t: SYMBOL_TOKEN, pos: number): SYMBOL_TYPE {
	return {
		type: 'symbol',
		value: t,
		pos
	};
}
function expr(t: EXPR_TOKEN, pos: number): EXPR_TYPE {
	return {
		type: 'expression',
		value: t,
		pos
	};
}
function opr(t: OP_TOKEN, pos: number): OP_TYPE {
	return {
		type: 'operation',
		value: t,
		pos
	};
}
function idnt(t: string, pos: number): IDENT_TYPE {
	return {
		type: 'identifier',
		value: t,
		pos
	};
}
function ukwn(t: string, pos: number): UNKNOWN_TYPE {
	return {
		type: 'unknown',
		value: t,
		pos
	};
}

describe('Parser', function () {
	describe('identity program', function () {
		it(`should be accepted`, function () {
			const expected: AST_PROG = {
				type: 'program',
				name: idnt('ident', 0),
				input: idnt('X', 11),
				output: idnt('X', 22),
				body: []
			};
			expect(parser(lexer(
				'ident read X {} write X'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('add 1 program', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('add1', 0),
				input: idnt('X', 10),
				output: idnt('Y', 38),
				body: [
					{
						type: 'assign',
						ident: idnt('Y', 14),
						arg: {
							type: 'operation',
							op: opr(TKN_CONS, 19),
							args: [
								idnt('nil', 24),
								idnt('X', 28)
							]
						}
					}
				]
			};
			expect(parser(lexer(
				'add1 read X { Y := cons nil X } write Y'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('add 1x2 program', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('add2', 0),
				input: idnt('X', 10),
				output: idnt('Y', 57),
				body: [
					{
						type: 'assign',
						ident: idnt('Y', 15),
						arg: {
							type: 'operation',
							op: opr(TKN_CONS, 20),
							args: [
								idnt('nil', 25),
								idnt('X', 29)
							]
						}
					},
					{
						type: 'assign',
						ident: idnt('Y', 33),
						arg: {
							type: 'operation',
							op: opr(TKN_CONS, 38),
							args: [
								idnt('nil', 43),
								idnt('Y', 47)
							]
						}
					}
				]
			};
			expect(parser(lexer(
				'add2\n' +
				'read X {\n' +
				'	Y := cons nil X;\n' +
				'	Y := cons nil Y\n' +
				'}\n' +
				'write Y'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('while statement', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('prog', 0),
				input: idnt('X', 10),
				output: idnt('X', 44),
				body: [
					{
						type: 'loop',
						condition: idnt('X', 20),
						body: [
							{
								type: 'assign',
								ident: idnt('X', 24),
								arg: {
									type: 'operation',
									op: opr(TKN_TL, 29),
									args: [
										idnt('X', 32)
									]
								}
							}
						],
					},
				]
			};
			expect(parser(lexer(
				'prog read X { while X { X := tl X } } write X'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('if statement', function () {
		it(`should accept an if without an else`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('prog', 0),
				input: idnt('X', 10),
				output: idnt('Y', 54),
				body: [
					{
						type: 'cond',
						condition: {
							type: 'operation',
							op: opr('tl', 18),
							args: [idnt('X', 21)],
						},
						if: [
							{
								type: 'assign',
								ident: idnt('Y', 26),
								arg: {
									type: 'operation',
									op: opr(TKN_CONS, 31),
									args: [
										idnt('nil', 36),
										idnt('nil', 40),
									]
								}
							}
						],
						else: []
					},
				]
			};
			expect(parser(lexer(
				'prog read X { if (tl X) { Y := cons nil nil } } write Y'
			))).to.deep.equal([
				expected,
				[]
			]);
		});

		//TODO: Test if-else
		//TODO: Test long string of cons
		//	cons cons nil cons nil nil cons nil nil
		//	cons (cons nil (cons nil nil)) (cons nil nil)
		//TODO: Test nested hd (e.g. hd hd hd X)
		//TODO: Test nested tl (e.g. hd hd hd X)
	});

	//TODO: Test errors from invalid programs
});
