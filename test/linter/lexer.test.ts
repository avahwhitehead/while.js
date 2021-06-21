import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import lexer from "../../src/linter/lexer";
import {
	EXPR_TOKEN,
	OP_TOKEN,
	SYMBOL_TOKEN,
	TKN_ASSGN,
	TKN_BLOCK_CLS,
	TKN_BLOCK_OPN,
	TKN_CONS,
	TKN_ELSE,
	TKN_HD,
	TKN_IF,
	TKN_PREN_CLS,
	TKN_PREN_OPN,
	TKN_READ,
	TKN_SEP,
	TKN_TL,
	TKN_WHILE,
	TKN_WRITE
} from "../../src/types/tokens";
import {
	EXPR_TOKEN_EXTD,
	OP_TOKEN_EXTD,
	SYMBOL_TOKEN_EXTD,
	TKN_CASE,
	TKN_COLON,
	TKN_COMMA,
	TKN_DEFAULT,
	TKN_DOT,
	TKN_EQL,
	TKN_FALSE,
	TKN_LIST_CLS,
	TKN_LIST_OPN,
	TKN_MCRO_CLS,
	TKN_MCRO_OPN,
	TKN_SWITCH,
	TKN_TRUE,
} from "../../src/types/extendedTokens";
import { e_expr, e_opr, e_sym, error, expr, idnt, nmbr, opr, sym, ukwn } from "../utils";

chai.config.truncateThreshold = 0;

const SYMBOL_ATOMS: SYMBOL_TOKEN[] = [
	//Symbols
	TKN_SEP,
	TKN_ASSGN,
	TKN_BLOCK_OPN, TKN_BLOCK_CLS,
	TKN_PREN_OPN, TKN_PREN_CLS,
];
const OP_ATOMS: OP_TOKEN[] = [
	//Operations
	TKN_CONS,
	TKN_HD, TKN_TL,
];
const EXPR_ATOMS: EXPR_TOKEN[] = [
	//Expressions
	TKN_READ, TKN_WRITE,
	TKN_IF, TKN_ELSE,
	TKN_WHILE,
];

const SYMBOL_ATOMS_EXTD: SYMBOL_TOKEN_EXTD[] = [
	//Symbols
	TKN_EQL,
	TKN_LIST_OPN,
	TKN_LIST_CLS,
	TKN_MCRO_OPN,
	TKN_MCRO_CLS,
	TKN_COMMA,
	TKN_DOT,
	TKN_COLON,
];
const EXPR_ATOMS_EXTD: EXPR_TOKEN_EXTD[] = [
	//Expressions
	TKN_SWITCH,
	TKN_CASE,
	TKN_DEFAULT,
];
const OP_ATOMS_EXTD: OP_TOKEN_EXTD[] = [
	//Operations
	TKN_TRUE,
	TKN_FALSE,
];

describe('Lexer', function () {
	for (let isPure of [false, true]) {
		describe(`${isPure ? 'Pure' : 'Extended'} Lexer`, function () {
			describe(`symbols`, function () {
				for (let atom of SYMBOL_ATOMS) {
					it(`should accept '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								sym(atom, 0, 0)
							],
							[]
						]);
					});
				}
			});
			describe(`symbols (extd)`, function () {
				for (let atom of SYMBOL_ATOMS_EXTD) {
					it(`should ${isPure ? 'reject' : 'accept'} '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								isPure ? ukwn(atom, 0, 0) : e_sym(atom, 0, 0)
							],
							isPure ? [error(`Unknown token "${atom}"`, 0, 0)] : []
						]);
					});
				}
			});

			describe(`expressions`, function () {
				for (let atom of EXPR_ATOMS) {
					it(`should accept expression '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								expr(atom, 0, 0)
							],
							[]
						]);
					});
				}
			})
			describe(`expressions (extd)`, function () {
				for (let atom of EXPR_ATOMS_EXTD) {
					it(`should ${isPure ? 'reject' : 'accept'} '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								isPure ? idnt(atom, 0, 0) : e_expr(atom, 0, 0)
							],
							[]
						]);
					});
				}
			});

			describe(`operations`, function () {
				for (let atom of OP_ATOMS) {
					it(`should accept operation '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								opr(atom, 0, 0)
							],
							[]
						]);
					});
				}
			});
			describe(`operations (extd)`, function () {
				for (let atom of OP_ATOMS_EXTD) {
					it(`should ${isPure ? 'reject' : 'accept'} '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								isPure ? idnt(atom, 0, 0) : e_opr(atom, 0, 0)
							],
							[]
						]);
					});
				}
			});

			describe(`identifiers`, function () {
				for (let atom of ['nil', 'X', 'Y', 'XY', 'my_variable_name']) {
					it(`should accept identifier '${atom}'`, function () {
						expect(
							lexer(atom, {pureOnly: isPure})
						).to.deep.equal([
							[
								idnt(atom, 0, 0)
							],
							[]
						]);
					});
				}
			});

			describe(`numbers`, function () {
				for (let numSt of ['0', '1', '2', '99']) {
					if (isPure) {
						it(`should reject '${numSt}'`, function () {
							expect(
								lexer(numSt, {pureOnly:isPure})
							).to.deep.equal([
								numSt.split('').map((c, i) =>
									ukwn(c, 0, i)
								),
								numSt.split('').map((c, i) =>
									error(`Unknown token "${c}"`, 0, i)
								)
							]);
						});
					} else {
						let num: number = Number.parseInt(numSt);
						it(`should accept '${numSt}'`, function () {
							expect(
								lexer(numSt, {pureOnly:isPure})
							).to.deep.equal([
								[
									nmbr(num, 0, 0)
								],
								[]
							]);
						});
					}
				}
			});
		});
	}

	describe(`Invalid atoms`, function () {
		for (let atom of ['~', '#']) {
			it(`should reject '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal([
					[
						ukwn(atom, 0, 0)
					],
					[
						error(`Unknown token "${atom}"`, 0, 0)
					]
				]);
			});
		}
		it(`should produce errors for adjacent invalid tokens`, function () {
			expect(lexer(
				`prog -+ read #`
			)).to.deep.equal([
				[
					idnt('prog', 0, 0),
					ukwn('-', 0, 5),
					ukwn('+', 0, 6),
					expr(TKN_READ, 0, 8),
					ukwn('#', 0, 13),
				],
				[
					error(`Unknown token "-"`, 0, 5),
					error(`Unknown token "+"`, 0, 6),
					error(`Unknown token "#"`, 0, 13),
				]
			]);
		});
	});

	describe('Pure programs', function () {
		describe('identity program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'ident read X {} write X'
				)).to.deep.equal([
					[
						idnt('ident', 0, 0),
						expr(TKN_READ, 0, 6),
						idnt('X', 0, 11),
						sym(TKN_BLOCK_OPN, 0, 13),
						sym(TKN_BLOCK_CLS, 0, 14),
						expr(TKN_WRITE, 0, 16),
						idnt('X', 0, 22)
					],
					[]
				]);
			});
		});

		describe('add 1 program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'add1 read X { Y := cons nil X } write Y'
				)).to.deep.equal([
					[
						idnt('add1', 0, 0),
						expr(TKN_READ, 0, 5),
						idnt('X', 0, 10),
						sym(TKN_BLOCK_OPN, 0, 12),
							idnt('Y', 0, 14),
							sym(TKN_ASSGN, 0, 16),
							opr(TKN_CONS, 0, 19),
							idnt('nil', 0, 24),
							idnt('X', 0, 28),
						sym(TKN_BLOCK_CLS, 0, 30),
						expr(TKN_WRITE, 0, 32),
						idnt('Y', 0, 38)
					],
					[]
				]);
			});
		});

		describe('add 1x2 program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'add2\n' +
					'read X {\n' +
					'	Y := cons nil X;\n' +
					'	Y := cons nil Y\n' +
					'}\n' +
					'write Y'
				)).to.deep.equal([
					[
						idnt('add2', 0, 0),
						expr(TKN_READ, 1, 0),
						idnt('X', 1, 5),
						sym(TKN_BLOCK_OPN, 1, 7),
							idnt('Y', 2, 1),
							sym(TKN_ASSGN, 2, 3),
							opr(TKN_CONS, 2, 6),
							idnt('nil', 2, 11),
							idnt('X', 2, 15),
							sym(TKN_SEP, 2, 16),

							idnt('Y', 3, 1),
							sym(TKN_ASSGN, 3, 3),
							opr(TKN_CONS, 3, 6),
							idnt('nil', 3, 11),
							idnt('Y', 3, 15),
						sym(TKN_BLOCK_CLS, 4, 0),
						expr(TKN_WRITE, 5, 0),
						idnt('Y', 5, 6)
					],
					[]
				]);
			});
		});

		describe('comments', function () {
			describe('single line comment', function () {
				it(`should ignore the comment`, function () {
					expect(lexer(
						'//This is a program to do something...\n' +
						'prog\n' +
						'read X {\n' +
						'	//Do something\n' +
						'}\n' +
						'write X'
					)).to.deep.equal([
						[
							idnt('prog', 1, 0),
							expr(TKN_READ, 2, 0),
							idnt('X', 2, 5),
							sym(TKN_BLOCK_OPN, 2, 7),
								//Nothing here
							sym(TKN_BLOCK_CLS, 4, 0),
							expr(TKN_WRITE, 5, 0),
							idnt('X', 5, 6)
						],
						[]
					]);
				});
			});

			describe('EOL comment', function () {
				it(`should ignore the comment to the end of the line`, function () {
					expect(lexer(
						'prog\n' +
						'read X {\n' +
						'	X := tl X //Get the right child\n' +
						'}\n' +
						'write X'
					)).to.deep.equal([
						[
							idnt('prog', 0, 0),
							expr(TKN_READ, 1, 0),
							idnt('X', 1, 5),
							sym(TKN_BLOCK_OPN, 1, 7),
								idnt('X', 2, 1),
								sym(TKN_ASSGN, 2, 3),
								opr(TKN_TL, 2, 6),
								idnt('X', 2, 9),
							sym(TKN_BLOCK_CLS, 3, 0),
							expr(TKN_WRITE, 4, 0),
							idnt('X', 4, 6)
						],
						[]
					]);
				});
			});

			describe('inline comment', function () {
				it(`should ignore the comment`, function () {
					expect(lexer(
						'prog\n' +
						'read X {\n' +
						'	X := tl (*Get the right child*) X\n' +
						'}\n' +
						'write X'
					)).to.deep.equal([
						[
							idnt('prog', 0, 0),
							expr(TKN_READ, 1, 0),
							idnt('X', 1, 5),
							sym(TKN_BLOCK_OPN, 1, 7),
								idnt('X', 2, 1),
								sym(TKN_ASSGN, 2, 3),
								opr(TKN_TL, 2, 6),
								idnt('X', 2, 33),
							sym(TKN_BLOCK_CLS, 3, 0),
							expr(TKN_WRITE, 4, 0),
							idnt('X', 4, 6)
						],
						[]
					]);
				});
			});

			describe('multiline comment', function () {
				it(`should ignore the commented lines`, function () {
					expect(lexer(
						'prog\n' +
						'read X {\n' +
						'	(*\n' +
						'	This is a commented line\n' +
						'	X := tl X\n' +
						'	None of this is parsed\n' +
						'	*)\n' +
						'}\n' +
						'write X'
					)).to.deep.equal([
						[
							idnt('prog', 0, 0),
							expr(TKN_READ, 1, 0),
							idnt('X', 1, 5),
							sym(TKN_BLOCK_OPN, 1, 7),
								//Nothing here
							sym(TKN_BLOCK_CLS, 7, 0),
							expr(TKN_WRITE, 8, 0),
							idnt('X', 8, 6)
						],
						[]
					]);
				});
			});
		});

		describe('Comment only', function () {
			describe(`should produce an empty list`, function () {
				it('EOL comment', function () {
					expect(lexer(
						'//An empty file'
					)).to.deep.equal([
						[],
						[]
					]);
				});
				it('inline comment', function () {
					expect(lexer(
						'(*An empty file*)'
					)).to.deep.equal([
						[],
						[]
					]);
				});
				it('multiline comment', function () {
					expect(lexer(
						'(*\n' +
						'An empty file\n' +
						'*)\n'
					)).to.deep.equal([
						[],
						[]
					]);
				});
			});
		});
	});

	describe('Extended programs', function () {
		describe('switch', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					's read X {\n' +
					'  switch X {\n' +
					'    case tl tl X:\n' +
					'      Y := cons nil (cons nil nil)\n' +
					'    case tl X:\n' +
					'      Y := cons nil nil\n' +
					'    default:\n' +
					'      Y := nil\n' +
					'  }\n' +
					'} write Y'
				)).to.deep.equal([
					[
						idnt('s', 0, 0),
						expr(TKN_READ, 0, 2),
						idnt('X', 0, 7),
						sym(TKN_BLOCK_OPN, 0, 9),
							e_expr(TKN_SWITCH, 1, 2),
							idnt('X', 1, 9),
							sym(TKN_BLOCK_OPN, 1, 11),
								e_expr(TKN_CASE, 2, 4),
								e_opr(TKN_TL, 2, 9),
								e_opr(TKN_TL, 2, 12),
								idnt('X', 2, 15),
								e_sym(TKN_COLON, 2, 16),
									idnt('Y', 3, 6),
									sym(TKN_ASSGN, 3, 8),
									e_opr(TKN_CONS, 3, 11),
									idnt('nil', 3, 16),
									e_sym(TKN_PREN_OPN, 3, 20),
									e_opr(TKN_CONS, 3, 21),
									idnt('nil', 3, 26),
									idnt('nil', 3, 30),
									e_sym(TKN_PREN_CLS, 3, 33),

								e_expr(TKN_CASE, 4, 4),
								e_opr(TKN_TL, 4, 9),
								idnt('X', 4, 12),
								e_sym(TKN_COLON, 4, 13),
									idnt('Y', 5, 6),
									sym(TKN_ASSGN, 5, 8),
									e_opr(TKN_CONS, 5, 11),
									idnt('nil', 5, 16),
									idnt('nil', 5, 20),

								e_expr(TKN_DEFAULT, 6, 4),
								e_sym(TKN_COLON, 6, 11),
									idnt('Y', 7, 6),
									sym(TKN_ASSGN, 7, 8),
									idnt('nil', 7, 11),
							sym(TKN_BLOCK_CLS, 8, 2),
						sym(TKN_BLOCK_CLS, 9, 0),
						expr(TKN_WRITE, 9, 2),
						idnt('Y', 9, 8)
					],
					[]
				]);
			});
		});

		describe('equality', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'eql read X {\n' +
					'  C := cons nil cons nil nil\n' +
					'  if X = C {\n' +
					'    res := cons nil nil\n' +
					'  } else {\n' +
					'    res := nil\n' +
					'  }\n' +
					'} write res'
				)).to.deep.equal([
					[
						idnt('eql', 0, 0),
						expr(TKN_READ, 0, 4),
						idnt('X', 0, 9),
						sym(TKN_BLOCK_OPN, 0, 11),
							idnt('C', 1, 2),
							sym(TKN_ASSGN, 1, 4),
							opr(TKN_CONS, 1, 7),
							idnt('nil', 1, 12),
							opr(TKN_CONS, 1, 16),
							idnt('nil', 1, 21),
							idnt('nil', 1, 25),

							expr(TKN_IF, 2, 2),
							idnt('X', 2, 5),
							e_sym(TKN_EQL, 2, 7),
							idnt('C', 2, 9),
							sym(TKN_BLOCK_OPN, 2, 11),
								idnt('res', 3, 4),
								sym(TKN_ASSGN, 3, 8),
								opr(TKN_CONS, 3, 11),
								idnt('nil', 3, 16),
								idnt('nil', 3, 20),
							sym(TKN_BLOCK_CLS, 4, 2),
							expr(TKN_ELSE, 4, 4),
							sym(TKN_BLOCK_OPN, 4, 9),
								idnt('res', 5, 4),
								sym(TKN_ASSGN, 5, 8),
								idnt('nil', 5, 11),
							sym(TKN_BLOCK_CLS, 6, 2),
						sym(TKN_BLOCK_CLS, 7, 0),
						expr(TKN_WRITE, 7, 2),
						idnt('res', 7, 8)
					],
					[]
				]);
			});
		});
	});
});
