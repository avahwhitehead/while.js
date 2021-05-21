//Symbols
export type SYMBOL_TOKEN = ';' | ':=' | '{' | '}' | '(' | ')';
export const TKN_SEP: SYMBOL_TOKEN = ';';
export const TKN_ASSGN: SYMBOL_TOKEN = ':=';
export const TKN_BLOCK_OPN: SYMBOL_TOKEN = '{';
export const TKN_BLOCK_CLS: SYMBOL_TOKEN = '}';
export const TKN_PREN_OPN: SYMBOL_TOKEN = '(';
export const TKN_PREN_CLS: SYMBOL_TOKEN = ')';
const SYMBOL_LIST = [
	//Symbols
	TKN_SEP,
	TKN_ASSGN,
	TKN_BLOCK_OPN, TKN_BLOCK_CLS,
	TKN_PREN_OPN, TKN_PREN_CLS,
];

//Expressions/Atoms
export type EXPR_TOKEN = 'cons' | 'hd' | 'tl' | 'if' | 'else' | 'while' | 'read' | 'write';
export const TKN_CONS: EXPR_TOKEN = 'cons';
export const TKN_HD: EXPR_TOKEN = 'hd';
export const TKN_TL: EXPR_TOKEN = 'tl';
export const TKN_IF: EXPR_TOKEN = 'if';
export const TKN_ELSE: EXPR_TOKEN = 'else';
export const TKN_WHILE: EXPR_TOKEN = 'while';
export const TKN_READ: EXPR_TOKEN = 'read';
export const TKN_WRITE: EXPR_TOKEN = 'write';
const EXPR_LIST = [
	//Expressions
	TKN_READ, TKN_WRITE,
	TKN_CONS,
	TKN_HD, TKN_TL,
	TKN_IF, TKN_ELSE,
	TKN_WHILE,
];

//Token types
/**
 * Represents a symbol in the token list.
 */
export interface SYMBOL_TYPE {
	type: 'symbol';
	value: SYMBOL_TOKEN;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface EXPR_TYPE {
	type: 'expression';
	value: EXPR_TOKEN;
}

/**
 * Represents an identifier (variable) in the token list.
 */
export interface IDENT_TYPE {
	type: 'identifier';
	value: string;
}

/**
 * Represents an unknown identifier in the token list
 */
export interface UNKNOWN_TYPE {
	type: 'unknown';
	value: string;
}

/**
 * The type of the elements of the token list returned by the lexer
 */
export type WHILE_TOKEN = SYMBOL_TYPE | EXPR_TYPE | IDENT_TYPE | UNKNOWN_TYPE;

/**
 * Read an identifier (variable/program name) from the start of the program string.
 * Identifiers match the regex {@code /[a-z_]\w*\/i}
 * @param program	The program string
 */
function read_identifier(program: string): string|null {
	const exec = /^[a-z_]\w*/i.exec(program);
	if (exec === null) return null;
	return exec[0];
}

/**
 * Read a token from the start of the program string
 * @param program	The program string
 */
function read_next_token(program: string): WHILE_TOKEN|null {
	//Attempt to read a symbol
	for (let sym of SYMBOL_LIST) {
		//Check each symbol against the start of the program string
		if (program.substr(0, sym.length) === sym) {
			//Return the symbol token if a match is found
			return {
				type: 'symbol',
				value: sym
			};
		}
	}

	//Attempt to read an identifier
	//E.g. program/variable name, operator
	let expr: string|null = read_identifier(program);

	//Not possible - return an error
	if (expr === null) return null;

	//See if the identifier is a known value
	for (let tkn of EXPR_LIST) {
		if (expr === tkn) {
			return {
				type: 'expression',
				value: tkn
			};
		}
	}
	//Otherwise the token is an identifier name
	return {
		type: 'identifier',
		value: expr
	};
}

/**
 * Lex a program string into a list of tokens
 * @param program	The program to lex
 */
export default function lexer(program: string): WHILE_TOKEN[] {
	//Maintain a counter of how many characters have been processed
	let pos = 0;
	//Hold the produced token list
	let res: WHILE_TOKEN[] = [];

	//Run until the input string is empty
	while ((program = program.trim())) {
		let token: WHILE_TOKEN | null = read_next_token(program);
		if (token === null) {
			token = {
				type: 'unknown',
				value: program.charAt(0)
			};
		}
		res.push(token);
		pos += token.value.length;
		program = program.substring(token.value.length)
	}

	//Return the produced token list
	return res;
}