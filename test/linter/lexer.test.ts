import { expect } from "chai";
import { describe, it } from "mocha";
import lexer, {
	EXPR_TOKEN,
	EXPR_TYPE,
	IDENT_TYPE,
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

const SYMBOL_ATOMS: SYMBOL_TOKEN[] = [
	//Symbols
	TKN_SEP,
	TKN_ASSGN,
	TKN_BLOCK_OPN, TKN_BLOCK_CLS,
	TKN_PREN_OPN, TKN_PREN_CLS,
];
const EXPR_ATOMS: EXPR_TOKEN[] = [
	//Expressions
	TKN_READ, TKN_WRITE,
	TKN_CONS,
	TKN_HD, TKN_TL,
	TKN_IF, TKN_ELSE,
	TKN_WHILE,
];

function sym(t: SYMBOL_TOKEN): SYMBOL_TYPE {
	return {
		type: 'symbol',
		value: t,
	};
}
function expr(t: EXPR_TOKEN): EXPR_TYPE {
	return {
		type: 'expression',
		value: t,
	};
}
function idnt(t: string): IDENT_TYPE {
	return {
		type: 'identifier',
		value: t,
	};
}
function ukwn(t: string): UNKNOWN_TYPE {
	return {
		type: 'unknown',
		value: t,
	};
}

describe('Lexer', function () {
	describe(`atoms`, function () {
		for (let atom of SYMBOL_ATOMS) {
			it(`should accept symbol '${atom}'`, function () {
				expect(lexer(atom)).to.eql(
					[sym(atom)]
				);
			});
		}
		for (let atom of EXPR_ATOMS) {
			it(`should accept expression '${atom}'`, function () {
				expect(lexer(atom)).to.eql(
					[expr(atom)]
				);
			});
		}
	});

	describe(`identifiers`, function () {
		for (let atom of ['nil', 'X', 'Y', 'XY', 'my_variable_name']) {
			it(`should accept identifier '${atom}'`, function () {
				expect(lexer(atom)).to.eql(
					[idnt(atom)]
				);
			});
		}
	});

	describe(`invalid atoms`, function () {
		for (let atom of [':', '#']) {
			it(`should reject '${atom}'`, function () {
				expect(lexer(atom)).to.eql(
					[ukwn(atom)]
				);
			});
		}
		describe(`numbers`, function () {
			for (let atom of ['0', '1', '2', '9']) {
				it(`should reject '${atom}'`, function () {
					expect(lexer(atom)).to.eql(
						[ukwn(atom)]
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
				)).to.eql(
					[
						idnt('ident'),
						expr(TKN_READ),
						idnt('X'),
						sym(TKN_BLOCK_OPN),
						sym(TKN_BLOCK_CLS),
						expr(TKN_WRITE),
						idnt('X'),
					]
				);
			});
		});
		describe('add 1 program', function () {
			it(`should be accepted`, function () {
				expect(lexer(
					'add1 read X { Y := cons nil X } write Y'
				)).to.eql(
					[
						idnt('add1'),
						expr(TKN_READ),
						idnt('X'),
						sym(TKN_BLOCK_OPN),
							idnt('Y'),
							sym(TKN_ASSGN),
							expr(TKN_CONS),
							idnt('nil'),
							idnt('X'),
						sym(TKN_BLOCK_CLS),
						expr(TKN_WRITE),
						idnt('Y'),
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
				)).to.eql(
					[
						idnt('add2'),
						expr(TKN_READ),
						idnt('X'),
						sym(TKN_BLOCK_OPN),
							idnt('Y'),
							sym(TKN_ASSGN),
							expr(TKN_CONS),
							idnt('nil'),
							idnt('X'),
							sym(TKN_SEP),

							idnt('Y'),
							sym(TKN_ASSGN),
							expr(TKN_CONS),
							idnt('nil'),
							idnt('Y'),
						sym(TKN_BLOCK_CLS),
						expr(TKN_WRITE),
						idnt('Y'),
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
					)).to.eql(
						[
							idnt('prog'),
							expr(TKN_READ),
							idnt('X'),
							sym(TKN_BLOCK_OPN),
								//Nothing here
							sym(TKN_BLOCK_CLS),
							expr(TKN_WRITE),
							idnt('X'),
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
					)).to.eql(
						[
							idnt('prog'),
							expr(TKN_READ),
							idnt('X'),
							sym(TKN_BLOCK_OPN),
								idnt('X'),
								sym(TKN_ASSGN),
								expr(TKN_TL),
								idnt('X'),
							sym(TKN_BLOCK_CLS),
							expr(TKN_WRITE),
							idnt('X'),
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
					)).to.eql(
						[
							idnt('prog'),
							expr(TKN_READ),
							idnt('X'),
							sym(TKN_BLOCK_OPN),
								idnt('X'),
								sym(TKN_ASSGN),
								expr(TKN_TL),
								idnt('X'),
							sym(TKN_BLOCK_CLS),
							expr(TKN_WRITE),
							idnt('X'),
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
					)).to.eql(
						[
							idnt('prog'),
							expr(TKN_READ),
							idnt('X'),
							sym(TKN_BLOCK_OPN),
								//Nothing here
							sym(TKN_BLOCK_CLS),
							expr(TKN_WRITE),
							idnt('X'),
						]
					);
				});
			});
		});

		describe('multiline comment', function () {
			describe('only comment', function () {
				it(`should produce empty lists`, function () {
					expect(lexer(
						'//An empty file'
					)).to.eql(
						[]
					);
					expect(lexer(
						'(*' +
						'An empty file' +
						'*)'
					)).to.eql(
						[]
					);
				});
			});
		});
	});
});
