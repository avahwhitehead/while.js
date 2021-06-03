import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import lexer, {
	EOI_TYPE,
	EXPR_TOKEN,
	EXPR_TYPE,
	IDENT_TYPE, OP_TOKEN, OP_TYPE,
	SYMBOL_TOKEN,
	SYMBOL_TYPE,
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
	TKN_WRITE,
	UNKNOWN_TYPE
} from "../../src/linter/lexer";

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
function eoi(pos: number): EOI_TYPE {
	return {
		type: 'eoi',
		pos
	};
}

describe('Lexer', function () {
	describe(`atoms`, function () {
		for (let atom of SYMBOL_ATOMS) {
			it(`should accept symbol '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal(
					[
						sym(atom, 0),
						eoi(atom.length)
					]
				);
			});
		}
		for (let atom of EXPR_ATOMS) {
			it(`should accept expression '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal(
					[
						expr(atom, 0),
						eoi(atom.length)
					]
				);
			});
		}
		for (let atom of OP_ATOMS) {
			it(`should accept operation '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal(
					[
						opr(atom, 0),
						eoi(atom.length)
					]
				);
			});
		}
	});

	describe(`identifiers`, function () {
		for (let atom of ['nil', 'X', 'Y', 'XY', 'my_variable_name']) {
			it(`should accept identifier '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal(
					[
						idnt(atom, 0),
						eoi(atom.length)
					]
				);
			});
		}
	});

	describe(`invalid atoms`, function () {
		for (let atom of [':', '#']) {
			it(`should reject '${atom}'`, function () {
				expect(lexer(atom)).to.deep.equal(
					[
						ukwn(atom, 0),
						eoi(1)
					]
				);
			});
		}
		describe(`numbers`, function () {
			for (let atom of ['0', '1', '2', '9']) {
				it(`should reject '${atom}'`, function () {
					expect(lexer(atom)).to.deep.equal(
						[
							ukwn(atom, 0),
							eoi(1)
						]
					);
				});
			}
		});
	});

	describe('programs', function () {
		describe('identity program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'ident read X {} write X'
				)).to.deep.equal(
					[
						idnt('ident', 0),
						expr(TKN_READ, 6),
						idnt('X', 11),
						sym(TKN_BLOCK_OPN, 13),
						sym(TKN_BLOCK_CLS, 14),
						expr(TKN_WRITE, 16),
						idnt('X', 22),
						eoi(23)
					]
				);
			});
		});
		describe('add 1 program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'add1 read X { Y := cons nil X } write Y'
				)).to.deep.equal(
					[
						idnt('add1', 0),
						expr(TKN_READ, 5),
						idnt('X', 10),
						sym(TKN_BLOCK_OPN, 12),
							idnt('Y', 14),
							sym(TKN_ASSGN, 16),
							opr(TKN_CONS, 19),
							idnt('nil', 24),
							idnt('X', 28),
						sym(TKN_BLOCK_CLS, 30),
						expr(TKN_WRITE, 32),
						idnt('Y', 38),
						eoi(39)
					]
				);
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
				)).to.deep.equal(
					[
						idnt('add2', 0),
						expr(TKN_READ, 5),
						idnt('X', 10),
						sym(TKN_BLOCK_OPN, 12),
							idnt('Y', 15),
							sym(TKN_ASSGN, 17),
							opr(TKN_CONS, 20),
							idnt('nil', 25),
							idnt('X', 29),
							sym(TKN_SEP, 30),

							idnt('Y', 33),
							sym(TKN_ASSGN, 35),
							opr(TKN_CONS, 38),
							idnt('nil', 43),
							idnt('Y', 47),
						sym(TKN_BLOCK_CLS, 49),
						expr(TKN_WRITE, 51),
						idnt('Y', 57),
						eoi(58)
					]
				);
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
					)).to.deep.equal(
						[
							idnt('prog', 39),
							expr(TKN_READ, 44),
							idnt('X', 49),
							sym(TKN_BLOCK_OPN, 51),
								//Nothing here
							sym(TKN_BLOCK_CLS, 69),
							expr(TKN_WRITE, 71),
							idnt('X', 77),
							eoi(78)
						]
					);
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
					)).to.deep.equal(
						[
							idnt('prog', 0),
							expr(TKN_READ, 5),
							idnt('X', 10),
							sym(TKN_BLOCK_OPN, 12),
								idnt('X', 15),
								sym(TKN_ASSGN, 17),
								opr(TKN_TL, 20),
								idnt('X', 23),
							sym(TKN_BLOCK_CLS, 47),
							expr(TKN_WRITE, 49),
							idnt('X', 55),
							eoi(56)
						]
					);
				});
			});

			describe('inline comment', function () {
				it(`should ignore the comment`, function () {
					expect(lexer(
						'prog\n' +
						'read X {\n' +
						'	X := tl (*Get the right child*) X' +
						'}\n' +
						'write X'
					)).to.deep.equal(
						[
							idnt('prog', 0),
							expr(TKN_READ, 5),
							idnt('X', 10),
							sym(TKN_BLOCK_OPN, 12),
								idnt('X', 15),
								sym(TKN_ASSGN, 17),
								opr(TKN_TL, 20),
								idnt('X', 47),
							sym(TKN_BLOCK_CLS, 48),
							expr(TKN_WRITE, 50),
							idnt('X', 56),
							eoi(57)
						]
					);
				});
			});

			describe('multiline comment', function () {
				it(`should ignore the commented lines`, function () {
					expect(lexer(
						'prog\n' +
						'read X {\n' +
						'	(*' +
						'	This is a commented line' +
						'	X := tl X' +
						'	None of this is parsed' +
						'	*)' +
						'}\n' +
						'write X'
					)).to.deep.equal(
						[
							idnt('prog', 0),
							expr(TKN_READ, 5),
							idnt('X', 10),
							sym(TKN_BLOCK_OPN, 12),
								//Nothing here
							sym(TKN_BLOCK_CLS, 78),
							expr(TKN_WRITE, 80),
							idnt('X', 86),
							eoi(87)
						]
					);
				});
			});
		});

		describe('only comment', function () {
			describe('EOL comment', function () {
				it(`should produce an empty list`, function () {
					expect(lexer(
						'//An empty file'
					)).to.deep.equal(
						[eoi(15)]
					);
				});
			});
			describe('inline comment', function () {
				it(`should produce an empty list`, function () {
					expect(lexer(
						'(*An empty file*)'
					)).to.deep.equal(
						[eoi(2+13+2)]
					);
				});
			});
			describe('multiline comment', function () {
				it(`should produce an empty list`, function () {
					expect(lexer(
						'(*\n' +
						'An empty file\n' +
						'*)\n'
					)).to.deep.equal(
						[eoi(3+14+3)]
					);
				});
			});
		});
	});
});
