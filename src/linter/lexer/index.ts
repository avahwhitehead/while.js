import { ErrorManager, ErrorType } from "../../utils/errorManager";
import {
	COMMENT_TYPE,
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
	TKN_WRITE,
	UNKNOWN_TYPE,
	WHILE_TOKEN
} from "../../types/tokens";
import {
	EXPR_TOKEN_EXTD,
	OP_TOKEN_EXTD,
	PAD_VALUES,
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
	WHILE_TOKEN_EXTD,
} from "../../types/extendedTokens";
import { PositionalIterator } from "../../utils/PositionalIterator";

const SYMBOL_LIST: SYMBOL_TOKEN[] = [
	//Symbols
	TKN_SEP,
	TKN_ASSGN,
	TKN_BLOCK_OPN, TKN_BLOCK_CLS,
	TKN_PREN_OPN, TKN_PREN_CLS,
];
const EXPR_LIST: EXPR_TOKEN[] = [
	//Expression tokens
	TKN_READ, TKN_WRITE,
	TKN_IF, TKN_ELSE,
	TKN_WHILE,
];
const OP_LIST: OP_TOKEN[] = [
	//Operations
	TKN_CONS,
	TKN_HD, TKN_TL,
];
const SYMBOL_LIST_EXTD: SYMBOL_TOKEN_EXTD[] = [
	...SYMBOL_LIST,
	TKN_EQL,
	TKN_COMMA,
	TKN_DOT,
	TKN_COLON,
	TKN_MCRO_OPN, TKN_MCRO_CLS,
	TKN_LIST_OPN, TKN_LIST_CLS,
];
const EXPR_LIST_EXTD: EXPR_TOKEN_EXTD[] = [
	...EXPR_LIST,
	TKN_SWITCH,
	TKN_CASE,
	TKN_DEFAULT,
];
const OP_LIST_EXTD: OP_TOKEN_EXTD[] = [
	...OP_LIST,
	TKN_TRUE,
	TKN_FALSE,
];


/**
 * Configuration options for the lexer
 */
export interface LexerOptions {
	/**
	 * Whether to only accept tokens accepted by the pure language
	 */
	pureOnly?: boolean,
}

/**
 * The same as {@link LexerOptions} but with no undefined values.
 * For internal use only.
 */
interface IntLexerOptions {
	pureOny: boolean;
}

/**
 * Read an identifier (variable/program name) from the start of the program string.
 * Identifiers match the regex {@code /[a-z_]\w*\/i}
 * @param program	Iterator through the program string
 */
function read_identifier(program: PositionalIterator): string|null {
	//Read the longest identifier possible from the program string
	//Case insensitive, starts with a letter or underscore, optionally followed by any number of alphanumeric chars and underscores
	let matchLength = program.matchLength(/^[a-z_]\w*/i);
	if (matchLength > -1) return program.next(matchLength);
	return null;
}

/**
 * Read a number from the start of the program string.
 * @param program	Iterator through the program string
 */
function read_number(program: PositionalIterator): string|null {
	//Read the longest number possible from the program string
	//Must not be followed by an identifier character afterwards (e.g. `0a` or `0_2` as this is an invalid identifier)
	let matchLength = program.matchLength(/^\d+/);
	if (matchLength > -1) return program.next(matchLength);
	return null;
}

/**
 * Read a programs-as-data token from the start of the program string
 * @param program	Iterator through the program string
 */
function read_pad_token(program: PositionalIterator): string|null {
	let matchLength = program.matchLength(/^(@[:=a-z]+)/i);
	if (matchLength > -1) return program.next(matchLength);
	return null;
}

function read_comment_token(progIterator: PositionalIterator, errorManager: ErrorManager): COMMENT_TYPE|null {
	//End-of-line comment
	if (progIterator.matchAndConsume('//')) {
		let startPos = progIterator.getPosition();
		//Read the comment
		let value = progIterator.nextEOL();
		//Return the comment token
		return {
			type: 'comment',
			value,
			length: value.length,
			pos: startPos,
			endPos: progIterator.getPosition(),
		};
	}

	//Multiline/inline comment block
	if (progIterator.matchAndConsume('(*')) {
		let startPos = progIterator.getPosition();
		//Ignore text to the end of the comment block
		let length = progIterator.search('*)');
		let hasClosingTag = length > -1;

		//Assume the comment covers to the end of the file
		if (!hasClosingTag) length = progIterator.remaining;

		//Read the comment block
		let value = progIterator.next(length);

		//Get the end position before the closing block
		let endPos = progIterator.getPosition();

		//Error if there is a missing closing comment tag
		if (!hasClosingTag) {
			errorManager.addError(startPos, 'Missing expected closing comment symbol', progIterator.getPosition());
		} else {
			//Remove the closing symbols
			progIterator.next(2);
		}
		//Return the comment token
		return {
			type: 'comment',
			value,
			length: value.length,
			pos: startPos,
			endPos: endPos,
		};
	}

	//Not a comment
	return null;
}

/**
 * Read a token from the start of the program string
 * @param progIterator	Iterator through the program string
 * @param errorManager	Error manager object
 * @param pureOnly		Whether to only accept tokens used in the pure language
 * @returns WHILE_TOKEN			If {@code pureOnly} is {@code true}
 * @returns WHILE_TOKEN_EXTD	If {@code pureOnly} is {@code false}
 * @returns null	If the next token is not a valid symbol or identifier name
 */
function read_next_token(progIterator: PositionalIterator, errorManager: ErrorManager, pureOnly: boolean = false): WHILE_TOKEN|WHILE_TOKEN_EXTD|UNKNOWN_TYPE {
	let startPos = progIterator.getPosition();

	//Attempt to read a symbol
	for (let sym of pureOnly ? SYMBOL_LIST : SYMBOL_LIST_EXTD) {
		//Check each symbol against the start of the program string
		if (progIterator.matchAndConsume(sym)) {
			//Return the symbol token if a match is found
			return {
				type: 'symbol',
				value: sym,
				pos: startPos,
				endPos: progIterator.getPosition(),
				length: sym.length,
			};
		}
	}

	if (!pureOnly) {
		let expr: string|null;
		//Attempt to read a programs-as-data token
		expr = read_pad_token(progIterator);
		if (expr !== null) {
			return {
				type: 'number',
				token: expr,
				value: PAD_VALUES[expr],
				length: expr.length,
				pos: startPos,
				endPos: progIterator.getPosition(),
			}
		}

		//Attempt to read a number instead
		expr = read_number(progIterator);
		if (expr !== null) {
			return {
				type: 'number',
				token: expr,
				value: Number.parseInt(expr),
				length: expr.length,
				pos: startPos,
				endPos: progIterator.getPosition(),
			};
		}
	}

	//See if the identifier is a known value
	for (let tkn of pureOnly ? EXPR_LIST : EXPR_LIST_EXTD) {
		if (progIterator.matchAndConsume(tkn)) {
			return {
				type: 'expression',
				value: tkn,
				length: tkn.length,
				pos: startPos,
				endPos: progIterator.getPosition(),
			};
		}
	}

	for (let tkn of pureOnly ? OP_LIST : OP_LIST_EXTD) {
		if (progIterator.matchAndConsume(tkn)) {
			return {
				type: 'operation',
				value: tkn,
				length: tkn.length,
				pos: startPos,
				endPos: progIterator.getPosition(),
			};
		}
	}

	//Attempt to read an identifier
	//E.g. program/variable name, operator
	let expr: string|null = read_identifier(progIterator);
	if (expr !== null) {
		//Otherwise the token is an identifier name
		return {
			type: 'identifier',
			value: expr,
			length: expr.length,
			pos: startPos,
			endPos: progIterator.getPosition(),
		};
	}

	//Return the first character from the program string
	let next = progIterator.next();
	//Add an error at the current position
	errorManager.addError(
		startPos,
		`Unknown token "${next}"`,
		progIterator.getPosition()
	);
	//Mark unrecognised tokens
	return {
		type: 'unknown',
		value: next,
		length: next.length,
		pos: startPos,
		endPos: progIterator.getPosition(),
	};
}

/**
 * Lex a program string into a list of tokens
 * @param program	The program to lex
 * @param props		Configuration options for the lexer
 */
export default function lexer(program: string, props?: LexerOptions): [(WHILE_TOKEN|WHILE_TOKEN_EXTD)[], ErrorType[]] {
	let errorManager: ErrorManager = new ErrorManager();

	props = props || {};
	let options: IntLexerOptions = {
		pureOny: props.pureOnly || false
	};

	//Hold the produced token list
	let res: (WHILE_TOKEN|WHILE_TOKEN_EXTD)[] = [];

	let progIterator = new PositionalIterator(program);

	//Run until the input string is empty
	while (progIterator.hasNext()) {
		if (progIterator.matchAndConsume(/^\s+/)) continue;

		let commentToken = read_comment_token(progIterator, errorManager);
		if (commentToken !== null) {
			res.push(commentToken);
			continue;
		}

		//Read the next token in the program
		let token: WHILE_TOKEN_EXTD | WHILE_TOKEN | UNKNOWN_TYPE = read_next_token(progIterator, errorManager, options.pureOny);

		//Save the token to the list
		res.push(token);
	}
	//Return the produced token list and any created errors
	return [res, errorManager.errors,];
}
