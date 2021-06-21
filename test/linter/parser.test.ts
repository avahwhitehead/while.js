import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import parser from "../../src/linter/parser";
import lexer from "../../src/linter/lexer";
import {
	TKN_CONS,
	TKN_HD,
	TKN_TL,
	WHILE_TOKEN,
} from "../../src/types/tokens";
import { AST_PROG, AST_PROG_PARTIAL } from "../../src/types/ast";
import { expr, idnt, opr, sym, ukwn } from "../utils";
import { ErrorType } from "../../src";

chai.config.truncateThreshold = 0;

describe('Parser', function () {
	describe('identity program', function () {
		it(`should be accepted`, function () {
			const expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('ident', 0, 0),
				input: idnt('X', 0, 11),
				output: idnt('X', 0, 22),
				body: []
			};
			let [tokens,] = lexer(
				'ident read X {} write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('add 1 program', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('add1', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 0, 38),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 0, 14),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 0, 19),
							args: [
								idnt('nil', 0, 24),
								idnt('X', 0, 28)
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'add1 read X { Y := cons nil X } write Y',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('add 1x2 program', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('add2', 0, 0),
				input: idnt('X', 1, 5),
				output: idnt('Y', 5, 6),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 2, 1),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 2, 6),
							args: [
								idnt('nil', 2, 11),
								idnt('X', 2, 15)
							]
						}
					},
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 3, 1),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 3, 6),
							args: [
								idnt('nil', 3, 11),
								idnt('Y', 3, 15)
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'add2\n' +
				'read X {\n' +
				'	Y := cons nil X;\n' +
				'	Y := cons nil Y\n' +
				'}\n' +
				'write Y',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('while statement', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 44),
				body: [
					{
						type: 'loop',
						complete: true,
						condition: idnt('X', 0, 20),
						body: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X', 0, 24),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL, 0, 29),
									args: [
										idnt('X', 0, 32)
									]
								}
							}
						],
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { while X { X := tl X } } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('if statement', function () {
		it(`should accept an if without an else`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 0, 54),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'operation',
							complete: true,
							op: opr('tl', 0, 18),
							args: [idnt('X', 0, 21)],
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('Y', 0, 26),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 31),
									args: [
										idnt('nil', 0, 36),
										idnt('nil', 0, 40),
									]
								}
							}
						],
						else: []
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { if (tl X) { Y := cons nil nil } } write Y',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept an if-else statement`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 88),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: idnt('X', 0, 17),
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X', 0, 21),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL, 0, 26),
									args: [idnt('X', 0, 29)]
								}
							}
						],
						else: [
							{
								type: 'cond',
								complete: true,
								condition: idnt('X', 0, 43),
								if: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X', 0, 47),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL, 0, 52),
											args: [idnt('X', 0, 55)]
										}
									}
								],
								else: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X', 0, 66),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL, 0, 71),
											args: [idnt('X', 0, 74)]
										}
									}
								]
							},
						]
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { if X { X := tl X } else { if X { X := tl X } else { X := tl X } } } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('nested operations', function () {
		it(`should correctly parse nested cons`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 67),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X', 0, 14),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 0, 19),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 24),
									args: [
										//nil
										idnt('nil', 0, 29),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 33),
											args: [
												//nil nil
												idnt('nil', 0, 38),
												idnt('nil', 0, 42),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 46),
									args: [
										idnt('nil', 0, 51),
										idnt('nil', 0, 55),
									]
								}
							]
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { X := cons cons nil cons nil nil cons nil nil } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested cons with brackets`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 73),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X', 0, 14),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 0, 19),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 25),
									args: [
										//nil
										idnt('nil', 0, 30),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 35),
											args: [
												//nil nil
												idnt('nil', 0, 40),
												idnt('nil', 0, 44),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 51),
									args: [
										idnt('nil', 0, 56),
										idnt('nil', 0, 60),
									]
								}
							]
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { X := cons (cons nil (cons nil nil)) (cons nil nil) } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested hds`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 38),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X', 0, 14),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_HD, 0, 19),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_HD, 0, 22),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_HD, 0, 25),
								args: [idnt('X', 0, 28)]
							}]
						}]
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X { X := hd hd hd X } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested tls`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 38),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X', 0, 14),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_TL, 0, 19),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_TL, 0, 22),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_TL, 0, 25),
								args: [idnt('X', 0, 28)]
							}]
						}]
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X { X := tl tl tl X } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});
});

describe('Parser Error Checker', function () {
	describe('error in base structure', function () {
		it(`empty string`, function () {
			const expectedAst: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: null,
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Missing program name',
				position: { row: 0, col: 0 }
			}];
			let [tokens,] = lexer(
				'',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name"`, function () {
			let [tokens,] = lexer(
				'name',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Expected "read"',
				position: { row: 0, col: 4 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name {}"`, function () {
			let [tokens,] = lexer(
				'name {}',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				{
					message: 'Unexpected token: Expected "read"',
					position: { row: 0, col: 5 },
				},
				{
					message: 'Unexpected end of input: Expected "write"',
					position: { row: 0, col: 7 },
				}
			];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"{}"`, function () {
			let [tokens,] = lexer(
				'{}',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: null,
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				{
					message: `Unexpected token: Missing program name`,
					position: { row: 0, col: 0 }
				},
				{
					message: `Unexpected token: Expected "read"`,
					position: { row: 0, col: 0 }
				},
				{
					message: `Unexpected end of input: Expected "write"`,
					position: { row: 0, col: 2 }
				}
			];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read"`, function () {
			let [tokens,] = lexer(
				'name read',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: null,
				output: null,
				body: [],
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Missing input variable',
				position: { row: 0, col: 9 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read X {"`, function () {
			let [tokens,] = lexer(
				'name read X {',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 10),
				output: null,
				body: [],
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Expected "}"',
				position: { row: 0, col: 13 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`no closing bracket onwards`, function () {
			let [tokens,] = lexer(
				'name read Y {\n'
				+ '  X := Y',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('Y', 0, 10),
				output: null,
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X', 1, 2),
						arg: idnt('Y', 0, 32)
					}
				],
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Expected one of ";", "}"',
				position: { row: 1, col: 8 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read {}"`, function () {
			let [tokens,] = lexer(
				'name read {}',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				{
					message: 'Unexpected token "{": Missing input variable',
					position: { row: 0, col: 10 }
				},
				{
					message: 'Unexpected end of input: Expected "write"',
					position: { row: 0, col: 12 }
				}
			];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read X {}"`, function () {
			let [tokens,] = lexer(
				'name read X {}',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 10),
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				{
					message: 'Unexpected end of input: Expected "write"',
					position: { row: 0, col: 14 },
				},
			];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read X {} write"`, function () {
			let [tokens,] = lexer(
				'name read X {} write',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 10),
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [{
				//TODO: Remove quotes from type errors
				message: 'Unexpected end of input: Expected "identifier"',
				position: { row: 0, col: 20 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read X {} X"`, function () {
			let [tokens,] = lexer(
				'name read X {} X',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 10),
				body: [],
				output: idnt('X', 0, 15),
			};
			const expectedErrors: ErrorType[] = [
				{
					message: `Unexpected token "X": Expected "write"`,
					position: { row: 0, col: 15 }
				},
				//TODO: Should this have a separate error message for missing output variable?
				{
					message: 'Unexpected end of input: Expected "identifier"',
					position: { row: 0, col: 16 }
				}
			];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name X {} write X"`, function () {
			let [tokens,] = lexer(
				'name X {} write X',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 5),
				body: [],
				output: idnt('X', 0, 16),
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected token "X": Expected "read"',
				position: { row: 0, col: 5 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"name read X {} write"`, function () {
			let [tokens,] = lexer(
				'name read X {} write',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: idnt('name', 0, 0),
				input: idnt('X', 0, 10),
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected end of input: Expected "identifier"',
				position: { row: 0, col: 20 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});

		it(`"read X {} write X"`, function () {
			let [tokens,] = lexer(
				'read X {} write X',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			const expectedAst: AST_PROG_PARTIAL|null = {
				type: 'program',
				complete: false,
				name: null,
				input: idnt('X', 0, 5),
				body: [],
				output: idnt('X', 0, 16),
			};
			const expectedErrors: ErrorType[] = [{
				message: 'Unexpected token: Missing program name',
				position: { row: 0, col: 0 },
			}];
			expect(res[0]).to.deep.equal(expectedAst);
			expect(res[1]).to.deep.equal(expectedErrors);
		});
	});

	//TODO: Test same errors as above with populated code blocks

	describe('while statement', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 44),
				body: [
					{
						type: 'loop',
						complete: true,
						condition: idnt('X', 0, 20),
						body: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X', 0, 24),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL, 0, 29),
									args: [
										idnt('X', 0, 32)
									]
								}
							}
						],
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { while X { X := tl X } } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('if statement', function () {
		it(`should accept an if without an else`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 0, 54),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'operation',
							complete: true,
							op: opr('tl', 0, 18),
							args: [idnt('X', 0, 21)],
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('Y', 0, 26),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 31),
									args: [
										idnt('nil', 0, 36),
										idnt('nil', 0, 40),
									]
								}
							}
						],
						else: []
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { if (tl X) { Y := cons nil nil } } write Y',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept an if-else statement`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 88),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: idnt('X', 0, 17),
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X', 0, 21),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL, 0, 26),
									args: [idnt('X', 0, 29)]
								}
							}
						],
						else: [
							{
								type: 'cond',
								complete: true,
								condition: idnt('X', 0, 43),
								if: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X', 0, 47),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL, 0, 52),
											args: [idnt('X', 0, 55)]
										}
									}
								],
								else: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X', 0, 66),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL, 0, 71),
											args: [idnt('X', 0, 74)]
										}
									}
								]
							},
						]
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { if X { X := tl X } else { if X { X := tl X } else { X := tl X } } } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('nested operations', function () {
		it(`should correctly parse nested cons`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 67),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X', 0, 14),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 0, 19),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 24),
									args: [
										//nil
										idnt('nil', 0, 29),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 33),
											args: [
												//nil nil
												idnt('nil', 0, 38),
												idnt('nil', 0, 42),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 46),
									args: [
										idnt('nil', 0, 51),
										idnt('nil', 0, 55),
									]
								}
							]
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { X := cons cons nil cons nil nil cons nil nil } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested cons with brackets`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 73),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X', 0, 14),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS, 0, 19),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 25),
									args: [
										//nil
										idnt('nil', 0, 30),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 35),
											args: [
												//nil nil
												idnt('nil', 0, 40),
												idnt('nil', 0, 44),
											]
										}
									]
								},
								{
									//nil nil
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS, 0, 51),
									args: [
										idnt('nil', 0, 56),
										idnt('nil', 0, 60),
									]
								}
							]
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X { X := cons (cons nil (cons nil nil)) (cons nil nil) } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested hds`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 38),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X', 0, 14),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_HD, 0, 19),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_HD, 0, 22),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_HD, 0, 25),
								args: [idnt('X', 0, 28)]
							}]
						}]
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X { X := hd hd hd X } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should correctly parse nested tls`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 0, 38),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X', 0, 14),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_TL, 0, 19),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_TL, 0, 22),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_TL, 0, 25),
								args: [idnt('X', 0, 28)]
							}]
						}]
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X { X := tl tl tl X } write X',
			{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});
});
