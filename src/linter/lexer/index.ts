import Position, { incrementPos } from "../../types/position";
import { ErrorManager, ErrorType } from "../../utils/errorManager";
import {
	EXPR_TOKEN, OP_TOKEN,
	SYMBOL_TOKEN,
	TKN_ASSGN,
	TKN_BLOCK_CLS,
	TKN_BLOCK_OPN, TKN_CONS, TKN_ELSE, TKN_HD, TKN_IF, TKN_PREN_CLS,
	TKN_PREN_OPN, TKN_READ,
	TKN_SEP, TKN_TL, TKN_WHILE, TKN_WRITE,
	WHILE_TOKEN
} from "../../types/tokens";
import {
	EXPR_TOKEN_EXTD,
	OP_TOKEN_EXTD,
	SYMBOL_TOKEN_EXTD, TKN_CASE,
	TKN_COLON,
	TKN_COMMA, TKN_DEFAULT,
	TKN_DOT,
	TKN_EQL, TKN_FALSE,
	TKN_LIST_CLS,
	TKN_LIST_OPN,
	TKN_MCRO_CLS,
	TKN_MCRO_OPN, TKN_SWITCH,
	TKN_TRUE, WHILE_TOKEN_EXTD,
} from "../../types/extendedTokens";

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
 * @param program	The program string
 */
function read_identifier(program: string): string|null {
	//Read the longest identifier possible from the program string
	//Case insensitive, starts with a letter or underscore, optionally followed by any number of alphanumeric chars and underscores
	const exec = /^[a-z_]\w*/i.exec(program);
	if (exec === null) return null;
	return exec[0];
}

/**
 * Read a number from the start of the program string.
 * @param program	The program string
 */
function read_number(program: string): string|null {
// function read_number(program: string): number|null {
	//Read the longest number possible from the program string
	//Must not be followed by an identifier character afterwards (e.g. `0a` or `0_2` as this is an invalid identifier)
	const exec = /^(\d+)[^\w]*/.exec(program);
	if (exec === null) return null;
	return exec[1];
	// return Number.parseInt(exec[1]);
}

/**
 * Read a token from the start of the program string
 * @param program	The program string
 * @param pos		The position counter
 * @param pureOnly	Whether to only accept tokens used in the pure language
 * @returns WHILE_TOKEN			If {@code pureOnly} is {@code true}
 * @returns WHILE_TOKEN_EXTD	If {@code pureOnly} is {@code false}
 * @returns null	If the next token is not a valid symbol or identifier name
 */
function read_next_token(program: string, pos: Position, pureOnly: boolean = false): WHILE_TOKEN|WHILE_TOKEN_EXTD|null {
	//Attempt to read a symbol
	for (let sym of pureOnly ? SYMBOL_LIST : SYMBOL_LIST_EXTD) {
		//Check each symbol against the start of the program string
		if (program.substr(0, sym.length) === sym) {
			//Return the symbol token if a match is found
			return {
				type: 'symbol',
				value: sym,
				pos: {...pos},
				length: sym.length,
			};
		}
	}

	//Attempt to read an identifier
	//E.g. program/variable name, operator
	let expr: string|null = read_identifier(program);
	if (expr === null) {
		if (pureOnly) return null;
		//Attempt to read a number instead
		// let expr: number|null;
		expr = read_number(program);
		if (expr === null) return null;
		return {
			type: 'number',
			value: Number.parseInt(expr),
			length: expr.length,
			pos,
		};
	}

	//See if the identifier is a known value
	for (let tkn of pureOnly ? EXPR_LIST : EXPR_LIST_EXTD) {
		if (expr === tkn) {
			return {
				type: 'expression',
				value: tkn,
				length: tkn.length,
				pos,
			};
		}
	}
	for (let tkn of pureOnly ? OP_LIST : OP_LIST_EXTD) {
		if (expr === tkn) {
			return {
				type: 'operation',
				value: tkn,
				length: tkn.length,
				pos,
			};
		}
	}
	//Otherwise the token is an identifier name
	return {
		type: 'identifier',
		value: expr,
		length: expr.length,
		pos,
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

	//Maintain a counter of how many characters have been processed
	let pos: Position = { row:0, col:0 };
	//Hold the produced token list
	let res: (WHILE_TOKEN|WHILE_TOKEN_EXTD)[] = [];

	//Run until the input string is empty
	while (program.length) {
		const whitespace: RegExpMatchArray|null = program.match(/^\s+/);
		if (whitespace !== null) {
			let match = whitespace[0];
			incrementPos(pos, match);
			program = program.substring(match.length);
			continue;
		}

		//End-of-line comment
		if (program.substr(0, 2) === '//') {
			//Ignore text to the next line break, or the end of the program
			let index = program.search('\n') || -1;
			//Go to the end of the string
			if (index === -1) index = program.length;
			//Go to the end of the line, plus the line break
			else index += 1;

			pos.row++;
			pos.col = 0;
			program = program.substring(index);
			continue;
		}
		//Comment block (multiline/inline)
		if (program.substr(0, 2) == '(*') {
			//Ignore text to the end of the comment block
			let index = program.search(/\*\)/) || -1;
			index = index === -1 ? program.length : index + 2;
			incrementPos(
				pos,
				program.substring(0, index)
			);
			program = program.substring(index);
			continue;
		}

		//Read the next token in the program
		let token: WHILE_TOKEN_EXTD | WHILE_TOKEN | null = read_next_token(program, {...pos}, options.pureOny);
		if (token === null) {
			//Return the first character from the program string
			let next = program.charAt(0);
			//Add an error at the current position
			errorManager.addError(pos, `Unknown token "${next}"`);
			//Mark unrecognised tokens
			token = {
				type: 'unknown',
				value: next,
				pos: {...pos},
				length: next.length,
			};
		}
		//Save the token to the list
		res.push(token);
		//Remove the token from the start of the program
		if (typeof token.value === 'number') pos.col += token.length;
		else incrementPos(pos, token.value);
		// incrementPos(pos, program.substring(0, token.length));
		program = program.substring(token.length);
	}
	//Return the produced token list and any created errors
	return [res, errorManager.errors,];
}