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

		//TODO: Test nested hd (e.g. hd hd hd X)
		//TODO: Test nested tl (e.g. hd hd hd X)

		it(`should accept an if-else statement`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('prog', 0),
				input: idnt('X', 10),
				output: idnt('X', 88),
				body: [
					{
						type: 'cond',
						condition: idnt('X', 17),
						if: [
							{
								type: 'assign',
								ident: idnt('X', 21),
								arg: {
									type: 'operation',
									op: opr(TKN_TL, 26),
									args: [idnt('X', 29)]
								}
							}
						],
						else: [
							{
								type: 'cond',
								condition: idnt('X', 43),
								if: [
									{
										type: 'assign',
										ident: idnt('X', 47),
										arg: {
											type: 'operation',
											op: opr(TKN_TL, 52),
											args: [idnt('X', 55)]
										}
									}
								],
								else: [
									{
										type: 'assign',
										ident: idnt('X', 66),
										arg: {
											type: 'operation',
											op: opr(TKN_TL, 71),
											args: [idnt('X', 74)]
										}
									}
								]
							},
						]
					},
				]
			};
			expect(parser(lexer(
				'prog read X { if X { X := tl X } else { if X { X := tl X } else { X := tl X } } } write X'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('nested operations', function () {
		it(`should correctly parse nested cons`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('prog', 0),
				input: idnt('X', 10),
				output: idnt('X', 67),
				body: [
					{
						type: 'assign',
						ident: idnt('X', 14),
						arg: {
							//cons
							type: 'operation',
							op: opr(TKN_CONS, 19),
							args: [
								{
									//cons
									type: 'operation',
									op: opr(TKN_CONS, 24),
									args: [
										//nil
										idnt('nil', 29),
										{
											//cons
											type: 'operation',
											op: opr(TKN_CONS, 33),
											args: [
												//nil nil
												idnt('nil', 38),
												idnt('nil', 42),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									op: opr(TKN_CONS, 46),
									args: [
										idnt('nil', 51),
										idnt('nil', 55),
									]
								}
							]
						}
					},
				]
			};
			expect(parser(lexer(
				'prog read X { X := cons cons nil cons nil nil cons nil nil } write X'
			))).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested cons with brackets`, function () {
			let expected: AST_PROG = {
				type: 'program',
				name: idnt('prog', 0),
				input: idnt('X', 10),
				output: idnt('X', 73),
				body: [
					{
						type: 'assign',
						ident: idnt('X', 14),
						arg: {
							//cons
							type: 'operation',
							op: opr(TKN_CONS, 19),
							args: [
								{
									//cons
									type: 'operation',
									op: opr(TKN_CONS, 25),
									args: [
										//nil
										idnt('nil', 30),
										{
											//cons
											type: 'operation',
											op: opr(TKN_CONS, 35),
											args: [
												//nil nil
												idnt('nil', 40),
												idnt('nil', 44),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									op: opr(TKN_CONS, 51),
									args: [
										idnt('nil', 56),
										idnt('nil', 60),
									]
								}
							]
						}
					},
				]
			};
			expect(parser(lexer(
				'prog read X { X := cons (cons nil (cons nil nil)) (cons nil nil) } write X'
			))).to.deep.equal([
				expected,
				[]
			]);
		});
	});


	//TODO: Test errors from invalid programs
});
