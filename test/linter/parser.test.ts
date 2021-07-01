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
import { error, idnt, opr, tn, tree } from "../utils";
import { ErrorType } from "../../src";
import { WHILE_TOKEN_EXTD } from "../../src/types/extendedTokens";

chai.config.truncateThreshold = 0;

describe('Parser', function () {
	describe('values', function () {
		describe('pure', function () {
			it(`should convert 'nil' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(0))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := nil\n' +
					'} write Y',
					{pureOnly: true}
				);
				expect(parser(tokens, {pureOnly: true})).to.deep.equal([
					expected,
					[]
				]);
			});

			it(`should keep 'false' as an identifier`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: idnt('false', 1, 7)
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := false\n' +
					'} write Y',
					{pureOnly: true}
				);
				expect(parser(tokens, {pureOnly: true})).to.deep.equal([
					expected,
					[]
				]);
			});

			it(`should keep 'true' as an identifier`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: idnt('true', 1, 7)
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := true\n' +
					'} write Y',
					{pureOnly: true}
				);
				expect(parser(tokens, {pureOnly: true})).to.deep.equal([
					expected,
					[]
				]);
			});
		});

		describe('extended', function () {
			it(`should convert 'nil' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(0))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := nil\n' +
					'} write Y',
					{pureOnly: false}
				);
				expect(parser(tokens, {pureOnly: false})).to.deep.equal([
					expected,
					[]
				]);
			});

			it(`should convert 'false' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(0))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := false\n' +
					'} write Y',
					{pureOnly: false}
				);
				expect(parser(tokens, {pureOnly: false})).to.deep.equal([
					expected,
					[]
				]);
			});

			it(`should convert 'true' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(1))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := true\n' +
					'} write Y',
					{pureOnly: false}
				);
				expect(parser(tokens, {pureOnly: false})).to.deep.equal([
					expected,
					[]
				]);
			});
		});
	});

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
								tree(null),
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
								tree(null),
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
								tree(null),
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
										tree(null),
										tree(null),
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

		it(`extended language should accept an equals condition`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('X', 4, 8),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'equal',
							complete: true,
							arg1: idnt('X', 1, 5),
							arg2: tree(tn(5)),
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X', 2, 4),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL, 2, 9),
									args: [idnt('X', 2, 12)]
								}
							}
						],
						else: []
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  if X=5 {\n' +
				'    X := tl X\n' +
				'  }\n' +
				'} write X',
			) as [WHILE_TOKEN_EXTD[],unknown];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('switch statement', function () {
		it(`should accept an empty switch`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 3, 8),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X', 1, 9),
						cases: [],
						default: {
							type: 'switch_default',
							complete: true,
							body: []
						},
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'  }\n' +
				'} write Y',
			{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a switch with only a default`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 5, 8),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X', 1, 9),
						cases: [],
						default: {
							type: 'switch_default',
							complete: true,
							body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y', 3, 6),
									arg: {
										type: 'operation',
										complete: true,
										op: opr('cons', 3, 11),
										args: [
											tree(null),
											tree(null),
										],
									},
								}
							],
						},
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    default:\n' +
				'      Y := cons nil nil\n' +
				'  }\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a switch with multiple cases`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 9, 8),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X', 1, 9),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y1', 3, 6),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y2', 4, 6),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y', 5, 6),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons', 5, 11),
											args: [
												idnt('Y1', 5, 16),
												idnt('Y2', 5, 19),
											],
										},
									},
								],
							},
							{
								type: 'switch_case',
								complete: true,
								cond: {
									type: 'operation',
									complete: true,
									op: opr('cons', 6, 9),
									args: [
										tree(null),
										tree(null),
									]
								},
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y', 7, 6),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons', 7, 11),
											args: [
												tree(null),
												{
													type: 'operation',
													complete: true,
													op: opr('cons', 7, 20),
													args: [
														tree(null),
														tree(null),
													],
												},
											],
										},
									}
								],
							}
						],
						default: {
							type: 'switch_default',
							complete: true,
							body: [],
						},
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    case nil:\n' +
				'      Y1 := nil;\n' +
				'      Y2 := nil;\n' +
				'      Y := cons Y1 Y2\n' +
				'    case cons nil nil:\n' +
				'      Y := cons nil cons nil nil\n' +
				'  }\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a full switch with multiple cases`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 11, 8),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X', 1, 9),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y1', 3, 6),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y2', 4, 6),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y', 5, 6),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons', 5, 11),
											args: [
												idnt('Y1', 5, 16),
												idnt('Y2', 5, 19),
											],
										},
									},
								],
							},
							{
								type: 'switch_case',
								complete: true,
								cond: {
									type: 'operation',
									complete: true,
									op: opr('cons', 6, 9),
									args: [
										tree(null),
										tree(null),
									]
								},
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y', 7, 6),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons', 7, 11),
											args: [
												tree(null),
												{
													type: 'operation',
													complete: true,
													op: opr('cons', 7, 20),
													args: [
														tree(null),
														tree(null),
													],
												},
											],
										},
									}
								],
							}
						],
						default: {
							type: 'switch_default',
							complete: true,
							body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y', 9, 6),
									arg: {
										type: 'operation',
										complete: true,
										op: opr('cons', 9, 11),
										args: [
											tree(null),
											{
												type: 'operation',
												complete: true,
												op: opr('cons', 9, 20),
												args: [
													tree(null),
													{
														type: 'operation',
														complete: true,
														op: opr('cons', 9, 29),
														args: [
															tree(null),
															tree(null),
														],
													},
												],
											},
										],
									},
								}
							],
						},
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    case nil:\n' +
				'      Y1 := nil;\n' +
				'      Y2 := nil;\n' +
				'      Y := cons Y1 Y2\n' +
				'    case cons nil nil:\n' +
				'      Y := cons nil cons nil nil\n' +
				'    default:\n' +
				'      Y := cons nil cons nil cons nil nil\n' +
				'  }\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('numbers', function () {
		it(`extended language should accept 0`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: tree(tn(0))
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := 0\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`extended language should accept numbers`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: tree(tn(7))
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := 7\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`extended language should accept "long" numbers`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: tree(tn(12))
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := 12\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`pure language should reject numbers`, function () {
			let expected: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: false,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'operation',
							complete: false,
							op: null,
							args: []
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := 7\n' +
				'} write Y',
				{pureOnly: true}
			) as [WHILE_TOKEN[], ErrorType[]];
			expect(parser(tokens)).to.deep.equal([
				expected,
				[
					error(`Unexpected token "7": Expected an expression or an identifier`, 1, 7)
				]
			]);
		});
	});

	describe('values', function () {
		describe('pure', function () {
			it(`should convert 'nil' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(0))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := nil\n' +
					'} write Y',
					{pureOnly: false}
				);
				expect(parser(tokens)).to.deep.equal([
					expected,
					[]
				]);
			});

			it(`should convert 'true' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog', 0, 0),
					input: idnt('X', 0, 10),
					output: idnt('Y', 2, 8),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y', 1, 2),
							arg: tree(tn(0))
						}
					]
				};
				let [tokens,] = lexer(
					'prog read X {\n' +
					'  Y := nil\n' +
					'} write Y',
					{pureOnly: false}
				);
				expect(parser(tokens)).to.deep.equal([
					expected,
					[]
				]);
			});
		});
	});


	describe('lists', function () {
		it(`should accept empty lists`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'list',
							complete: true,
							elements: []
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := []\n' +
				'} write Y',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a list with 1 element`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								idnt('X', 1, 8)
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := [X]\n' +
				'} write Y'
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a list with multiple elements`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								idnt('X', 1, 8),
								{
									type: 'operation',
									complete: true,
									op: opr('hd', 1, 11),
									args: [idnt('X', 1, 14)]
								},
								{
									type: 'operation',
									complete: true,
									op: opr('tl', 1, 17),
									args: [idnt('X', 1, 20)]
								}
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := [X, hd X, tl X]\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept a list with complex elements`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								{
									type: 'list',
									complete: true,
									elements: [
										{
											type: 'operation',
											complete: true,
											op: opr('cons', 1, 9),
											args: [
												{
													type: 'operation',
													complete: true,
													op: opr('cons', 1, 14),
													args: [
														tree(null),
														tree(null)
													]
												},
												tree(null)
											]
										},
										{
											type: 'operation',
											complete: true,
											op: opr('hd', 1, 32),
											args: [
												{
													type: 'operation',
													complete: true,
													op: opr('hd', 1, 35),
													args: [idnt('X', 1, 38)]
												},
											]
										},
									]
								},
								idnt('X', 1, 42),
								{
									type: 'list',
									complete: true,
									elements: [
										idnt('X', 1, 46),
										idnt('X', 1, 49),
									]
								},
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := [[cons cons nil nil nil, hd hd X], X, [X, X]]\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('trees', function () {
		it(`should accept <nil.nil>`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'tree_expr',
						complete: true,
						left: tree(null),
						right: tree(null),
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <nil.nil>\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept <<nil.nil>.<nil.nil>>`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'tree_expr',
						complete: true,
						left: {
							type: 'tree_expr',
							complete: true,
							left: tree(null),
							right: tree(null),
						},
						right: {
							type: 'tree_expr',
							complete: true,
							left: tree(null),
							right: tree(null),
						},
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <<nil.nil>.<nil.nil>>\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept <4.5>`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'tree_expr',
						complete: true,
						left: tree(tn(4)),
						right: tree(tn(5)),
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <4.5>\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept <[4,5].[]>`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'tree_expr',
							complete: true,
							left: {
								type: 'list',
								complete: true,
								elements: [
									tree(tn(4)),
									tree(tn(5)),
								]
							},
							right: {
								type: 'list',
								complete: true,
								elements: [],
							},
						}

					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <[4,5].[]>\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept [<tl X.hd X>, <cons nil nil.cons hd X tl X>]`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y', 1, 2),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								// <tl X.hd X>
								{
									type: 'tree_expr',
									complete: true,
									left: {
										type: 'operation',
										complete: true,
										op: opr('tl', 1, 9),
										args: [idnt('X', 1, 12)],
									},
									right: {
										type: 'operation',
										complete: true,
										op: opr('hd', 1, 14),
										args: [idnt('X', 1, 17)],
									},
								},
								//<cons nil nil.cons hd X tl X>
								{
									type: 'tree_expr',
									complete: true,
									left: {
										type: 'operation',
										complete: true,
										op: opr('cons', 1, 22),
										args: [
											tree(null),
											tree(null)
										],
									},
									right: {
										type: 'operation',
										complete: true,
										op: opr('cons', 1, 35),
										args: [
											{
												type: 'operation',
												complete: true,
												op: opr('hd', 1, 40),
												args: [idnt('X', 1, 43)],
											},
											{
												type: 'operation',
												complete: true,
												op: opr('tl', 1, 45),
												args: [idnt('X', 1, 48)],
											},
										],
									},
								}
							]
						}
					}
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := [<tl X.hd X>, <cons nil nil.cons hd X tl X>]\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});

	describe('macros', function () {
		it(`should accept '<prog> 7'`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'macro',
						complete: true,
						program: 'prog',
						input: tree(tn(7))
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <prog> 7\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept '<prog> hd X'`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'macro',
						complete: true,
						program: 'prog',
						input: {
							type: 'operation',
							complete: true,
							op: opr('hd', 1, 14),
							args: [idnt('X', 1, 17)]
						}
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <prog> hd X\n' +
				'} write Y',
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should accept '<prog> cons hd X tl X'`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 2, 8),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y', 1, 2),
					arg: {
						type: 'macro',
						complete: true,
						program: 'prog',
						input: {
							type: 'operation',
							complete: true,
							op: opr('cons', 1, 14),
							args: [
								{
									type: 'operation',
									complete: true,
									op: opr('hd', 1, 19),
									args: [idnt('X', 1, 22)]
								},
								{
									type: 'operation',
									complete: true,
									op: opr('tl', 1, 24),
									args: [idnt('X', 1, 27)]
								}
							]
						}
					}
				}]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  Y := <prog> cons hd X tl X\n' +
				'} write Y',
			);
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
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 33),
											args: [
												//nil nil
												tree(null),
												tree(null),
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
										tree(null),
										tree(null),
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
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 35),
											args: [
												//nil nil
												tree(null),
												tree(null),
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
										tree(null),
										tree(null),
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
						arg: idnt('Y', 1, 7)
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
										tree(null),
										tree(null),
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

	describe('switch statement', function () {
		it(`should not accept empty cases`, function () {
			let expected: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 6, 8),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X', 1, 9),
						cases: [
							{
								type: 'switch_case',
								complete: false,
								cond: tree(null),
								body: [],
							}
						],
						default: {
							type: 'switch_default',
							complete: true,
							body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y', 4, 6),
									arg: tree(null),
								}
							],
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    case nil:\n' +
				'    default:\n' +
				'      Y := nil\n' +
				'  }\n' +
				'} write Y'
			);
			let errors: ErrorType[] = [
				error(`Switch cases may not have empty bodies`, 2, 12)
			];
			expect(parser(tokens)).to.deep.equal([
				expected,
				errors
			]);
		});

		it(`should not accept empty default`, function () {
			let expected: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 6, 8),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X', 1, 9),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y', 3, 6),
										arg: tree(null),
									}
								],
							}
						],
						default: {
							type: 'switch_default',
							complete: false,
							body: [],
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    case nil:\n' +
				'      Y := nil\n' +
				'    default:\n' +
				'  }\n' +
				'} write Y'
			);
			let errors: ErrorType[] = [
				error(`Switch cases may not have empty bodies`, 4, 11)
			];
			expect(parser(tokens)).to.deep.equal([
				expected,
				errors
			]);
		});

		it(`should not accept non-terminal default`, function () {
			let expected: AST_PROG_PARTIAL = {
				type: 'program',
				complete: false,
				name: idnt('prog', 0, 0),
				input: idnt('X', 0, 10),
				output: idnt('Y', 7, 8),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X', 1, 9),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y', 5, 6),
									arg: tree(null),
								}
								],
							}
						],
						default: {
							type: 'switch_default',
							complete: true,
							body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y', 3, 6),
									arg: tree(null),
								}

							],
						}
					},
				]
			};
			let [tokens,] = lexer(
				'prog read X {\n' +
				'  switch X {\n' +
				'    default:\n' +
				'      Y := nil\n' +
				'    case nil:\n' +
				'      Y := nil\n' +
				'  }\n' +
				'} write Y'
			);
			let errors: ErrorType[] = [
				error(`The 'default' case should be the last case in the block`, 4, 4)
			];
			expect(parser(tokens)).to.deep.equal([
				expected,
				errors
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
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 33),
											args: [
												//nil nil
												tree(null),
												tree(null),
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
										tree(null),
										tree(null),
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
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS, 0, 35),
											args: [
												//nil nil
												tree(null),
												tree(null),
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
										tree(null),
										tree(null),
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
