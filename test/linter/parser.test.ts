import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import parser from "../../src/linter/parser";
import lexer from "../../src/linter/lexer";
import { OP_TOKEN, TKN_CONS, TKN_HD, TKN_TL, WHILE_TOKEN, } from "../../src/types/tokens";
import { AST_IDENT_NAME, AST_OP_TOKEN, AST_PROG, AST_PROG_PARTIAL } from "../../src/types/ast";
import { error, tn, tree } from "../utils";
import { ErrorType } from "../../src";
import { OP_TOKEN_EXTD, WHILE_TOKEN_EXTD } from "../../src/types/extendedTokens";

chai.config.truncateThreshold = 0;

export function idnt(t: string): AST_IDENT_NAME {
	return {
		type: 'identName',
		value: t,
	};
}

export function opr(t: OP_TOKEN|OP_TOKEN_EXTD): AST_OP_TOKEN {
	return {
		type: 'opToken',
		value: t,
	};
}

describe('Parser', function () {
	describe('values', function () {
		describe('pure', function () {
			it(`should convert 'nil' to a tree`, function () {
				let expected: AST_PROG = {
					type: 'program',
					complete: true,
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
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
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
							arg: idnt('false')
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
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
							arg: idnt('true')
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
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
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
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
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
					name: idnt('prog'),
					input: idnt('X'),
					output: idnt('Y'),
					body: [
						{
							type: 'assign',
							complete: true,
							ident: idnt('Y'),
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
				name: idnt('ident'),
				input: idnt('X'),
				output: idnt('X'),
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
				name: idnt('add1'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								tree(null),
								idnt('X')
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
				name: idnt('add2'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								tree(null),
								idnt('X')
							]
						}
					},
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
						arg: {
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								tree(null),
								idnt('Y')
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'loop',
						complete: true,
						condition: idnt('X'),
						body: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL),
									args: [
										idnt('X')
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'operation',
							complete: true,
							op: opr('tl'),
							args: [idnt('X')],
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('Y'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: idnt('X'),
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL),
									args: [idnt('X')]
								}
							}
						],
						else: [
							{
								type: 'cond',
								complete: true,
								condition: idnt('X'),
								if: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL),
											args: [idnt('X')]
										}
									}
								],
								else: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL),
											args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'equal',
							complete: true,
							arg1: idnt('X'),
							arg2: tree(tn(5)),
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL),
									args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X'),
						cases: [],
						default: {
							type: 'switch_default',
							complete: true,
							body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y'),
									arg: {
										type: 'operation',
										complete: true,
										op: opr('cons'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X'),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y1'),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y2'),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons'),
											args: [
												idnt('Y1'),
												idnt('Y2'),
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
									op: opr('cons'),
									args: [
										tree(null),
										tree(null),
									]
								},
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons'),
											args: [
												tree(null),
												{
													type: 'operation',
													complete: true,
													op: opr('cons'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: true,
						condition: idnt('X'),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y1'),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y2'),
										arg: tree(null),
									},
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons'),
											args: [
												idnt('Y1'),
												idnt('Y2'),
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
									op: opr('cons'),
									args: [
										tree(null),
										tree(null),
									]
								},
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr('cons'),
											args: [
												tree(null),
												{
													type: 'operation',
													complete: true,
													op: opr('cons'),
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
									ident: idnt('Y'),
									arg: {
										type: 'operation',
										complete: true,
										op: opr('cons'),
										args: [
											tree(null),
											{
												type: 'operation',
												complete: true,
												op: opr('cons'),
												args: [
													tree(null),
													{
														type: 'operation',
														complete: true,
														op: opr('cons'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: false,
						ident: idnt('Y'),
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
					error(`Unexpected token "7": Expected an expression or an identifier`, 1, 7, 1, 8)
				]
			]);
		});
	});

	describe('equality binding', function () {
		it(`should correctly parse X = X`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('eq'),
				input: idnt('X'),
				output: idnt('R'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('R'),
						arg: {
							type: 'equal',
							complete: true,
							arg1: idnt('X'),
							arg2: idnt('X'),
						},
					},
				]
			};
			let [tokens,] = lexer(
				'eq read X {\n' +
				'  R := X = X\n' +
				'} write R\n',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});

		it(`should bind "hd X = tl X" correctly`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('eq'),
				input: idnt('X'),
				output: idnt('R'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('R'),
						arg: {
							type: 'equal',
							complete: true,
							arg1: {
								type: 'operation',
								complete: true,
								op: opr('hd'),
								args: [idnt('X')],
							},
							arg2: {
								type: 'operation',
								complete: true,
								op: opr('tl'),
								args: [idnt('X')],
							},
						},
					},
				]
			};
			let [tokens,] = lexer(
				'eq read X {\n' +
				'  R := hd X = tl X\n' +
				'} write R\n',
				{pureOnly: false}
			);
			expect(parser(tokens)).to.deep.equal([
				expected,
				[]
			]);
		});
	});


	describe('lists', function () {
		it(`should accept empty lists`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								idnt('X')
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
						arg: {
							type: 'list',
							complete: true,
							elements: [
								idnt('X'),
								{
									type: 'operation',
									complete: true,
									op: opr('hd'),
									args: [idnt('X')]
								},
								{
									type: 'operation',
									complete: true,
									op: opr('tl'),
									args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
											op: opr('cons'),
											args: [
												{
													type: 'operation',
													complete: true,
													op: opr('cons'),
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
											op: opr('hd'),
											args: [
												{
													type: 'operation',
													complete: true,
													op: opr('hd'),
													args: [idnt('X')]
												},
											]
										},
									]
								},
								idnt('X'),
								{
									type: 'list',
									complete: true,
									elements: [
										idnt('X'),
										idnt('X'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('Y'),
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
										op: opr('tl'),
										args: [idnt('X')],
									},
									right: {
										type: 'operation',
										complete: true,
										op: opr('hd'),
										args: [idnt('X')],
									},
								},
								//<cons nil nil.cons hd X tl X>
								{
									type: 'tree_expr',
									complete: true,
									left: {
										type: 'operation',
										complete: true,
										op: opr('cons'),
										args: [
											tree(null),
											tree(null)
										],
									},
									right: {
										type: 'operation',
										complete: true,
										op: opr('cons'),
										args: [
											{
												type: 'operation',
												complete: true,
												op: opr('hd'),
												args: [idnt('X')],
											},
											{
												type: 'operation',
												complete: true,
												op: opr('tl'),
												args: [idnt('X')],
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
					arg: {
						type: 'macro',
						complete: true,
						program: 'prog',
						input: {
							type: 'operation',
							complete: true,
							op: opr('hd'),
							args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('Y'),
					arg: {
						type: 'macro',
						complete: true,
						program: 'prog',
						input: {
							type: 'operation',
							complete: true,
							op: opr('cons'),
							args: [
								{
									type: 'operation',
									complete: true,
									op: opr('hd'),
									args: [idnt('X')]
								},
								{
									type: 'operation',
									complete: true,
									op: opr('tl'),
									args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X'),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
									args: [
										//nil
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS),
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
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X'),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
									args: [
										//nil
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS),
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
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X'),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_HD),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_HD),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_HD),
								args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X'),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_TL),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_TL),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_TL),
								args: [idnt('X')]
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
			const expectedErrors: ErrorType[] = [error(`Unexpected end of input: Missing program name`, 0, 0, 0, 0)];
			let [tokens,] = lexer(
				'',
				{pureOnly: true}
			) as [WHILE_TOKEN[],unknown];
			const res = parser(tokens);
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				error('Unexpected end of input: Expected "read"', 0, 4, 0, 4)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected token: Expected "read"`, 0, 5, 0, 6),
				error(`Unexpected end of input: Expected "write"`, 0, 7, 0, 7)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				error(`Unexpected token: Missing program name`, 0, 0, 0, 1),
				error(`Unexpected token: Expected "read"`, 0, 0, 0, 1),
				error(`Unexpected end of input: Expected "write"`, 0, 2, 0, 2)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: null,
				output: null,
				body: [],
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected end of input: Missing input variable`, 0, 9, 0, 9)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				output: null,
				body: [],
			};
			const expectedErrors: ErrorType[] = [error(`Unexpected end of input: Expected "}"`, 0, 13, 0, 13)];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('Y'),
				output: null,
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X'),
						arg: idnt('Y')
					}
				],
			};
			const expectedErrors: ErrorType[] = [error(`Unexpected end of input: Expected one of ";", "}"`, 1, 8, 1, 8)];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: null,
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected token "{": Missing input variable`, 0, 10, 0, 11),
				error(`Unexpected end of input: Expected "write"`, 0, 12, 0, 12)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected end of input: Expected "write"`, 0, 14, 0, 14),
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				body: [],
				output: null,
			};
			//TODO: Remove quotes from type errors
			const expectedErrors: ErrorType[] = [
				error(`Unexpected end of input: Expected "identifier"`, 0, 20, 0, 20)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				body: [],
				output: idnt('X'),
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected token "X": Expected "write"`, 0, 15, 0, 16),
				//TODO: Should this have a separate error message for missing output variable?
				error(`Unexpected end of input: Expected "identifier"`, 0, 16, 0, 16)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				body: [],
				output: idnt('X'),
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected token "X": Expected "read"`, 0, 5, 0, 6)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				name: idnt('name'),
				input: idnt('X'),
				body: [],
				output: null,
			};
			const expectedErrors: ErrorType[] = [
				error(`Unexpected end of input: Expected "identifier"`, 0, 20, 0, 20)
			];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
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
				input: idnt('X'),
				body: [],
				output: idnt('X'),
			};
			const expectedErrors: ErrorType[] = [error(`Unexpected token: Missing program name`, 0, 0, 0, 4)];
			expect(res).to.deep.equal([expectedAst, expectedErrors]);
		});
	});

	describe('while statement', function () {
		it(`should be accepted`, function () {
			let expected: AST_PROG = {
				type: 'program',
				complete: true,
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'loop',
						complete: true,
						condition: idnt('X'),
						body: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL),
									args: [
										idnt('X')
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: {
							type: 'operation',
							complete: true,
							op: opr('tl'),
							args: [idnt('X')],
						},
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('Y'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'cond',
						complete: true,
						condition: idnt('X'),
						if: [
							{
								type: 'assign',
								complete: true,
								ident: idnt('X'),
								arg: {
									type: 'operation',
									complete: true,
									op: opr(TKN_TL),
									args: [idnt('X')]
								}
							}
						],
						else: [
							{
								type: 'cond',
								complete: true,
								condition: idnt('X'),
								if: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL),
											args: [idnt('X')]
										}
									}
								],
								else: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('X'),
										arg: {
											type: 'operation',
											complete: true,
											op: opr(TKN_TL),
											args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X'),
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
									ident: idnt('Y'),
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
				error(`Switch cases may not have empty bodies`, 2, 12, 2, 13)
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X'),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
									{
										type: 'assign',
										complete: true,
										ident: idnt('Y'),
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
			);``
			let errors: ErrorType[] = [
				error(`Switch cases may not have empty bodies`, 4, 11, 4, 12)
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('Y'),
				body: [
					{
						type: 'switch',
						complete: false,
						condition: idnt('X'),
						cases: [
							{
								type: 'switch_case',
								complete: true,
								cond: tree(null),
								body: [
								{
									type: 'assign',
									complete: true,
									ident: idnt('Y'),
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
									ident: idnt('Y'),
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
				error(`The 'default' case should be the last case in the block`, 4, 4, 4, 8)
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X'),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
									args: [
										//nil
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS),
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
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [
					{
						type: 'assign',
						complete: true,
						ident: idnt('X'),
						arg: {
							//cons
							type: 'operation',
							complete: true,
							op: opr(TKN_CONS),
							args: [
								{
									//cons
									type: 'operation',
									complete: true,
									op: opr(TKN_CONS),
									args: [
										//nil
										tree(null),
										{
											//cons
											type: 'operation',
											complete: true,
											op: opr(TKN_CONS),
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
									op: opr(TKN_CONS),
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X'),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_HD),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_HD),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_HD),
								args: [idnt('X')]
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
				name: idnt('prog'),
				input: idnt('X'),
				output: idnt('X'),
				body: [{
					type: 'assign',
					complete: true,
					ident: idnt('X'),
					arg: {
						type: 'operation',
						complete: true,
						op: opr(TKN_TL),
						args: [{
							type: 'operation',
							complete: true,
							op: opr(TKN_TL),
							args: [{
								type: 'operation',
								complete: true,
								op: opr(TKN_TL),
								args: [idnt('X')]
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
