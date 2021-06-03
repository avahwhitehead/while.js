//Symbols
export type SYMBOL_TOKEN = ';' | ':=' | '{' | '}' | '(' | ')';
export const TKN_SEP: SYMBOL_TOKEN = ';';
export const TKN_ASSGN: SYMBOL_TOKEN = ':=';
export const TKN_BLOCK_OPN: SYMBOL_TOKEN = '{';
export const TKN_BLOCK_CLS: SYMBOL_TOKEN = '}';
export const TKN_PREN_OPN: SYMBOL_TOKEN = '(';
export const TKN_PREN_CLS: SYMBOL_TOKEN = ')';
const SYMBOL_LIST: SYMBOL_TOKEN[] = [
	//Symbols
	TKN_SEP,
	TKN_ASSGN,
	TKN_BLOCK_OPN, TKN_BLOCK_CLS,
	TKN_PREN_OPN, TKN_PREN_CLS,
];

//Expressions/Atoms
export type EXPR_TOKEN = 'if' | 'else' | 'while' | 'read' | 'write';
export const TKN_IF: EXPR_TOKEN = 'if';
export const TKN_ELSE: EXPR_TOKEN = 'else';
export const TKN_WHILE: EXPR_TOKEN = 'while';
export const TKN_READ: EXPR_TOKEN = 'read';
export const TKN_WRITE: EXPR_TOKEN = 'write';
const EXPR_LIST: EXPR_TOKEN[] = [
	//Expression tokens
	TKN_READ, TKN_WRITE,
	TKN_IF, TKN_ELSE,
	TKN_WHILE,
];

//Operations
export type OP_TOKEN = 'cons' | 'hd' | 'tl';
export const TKN_CONS: OP_TOKEN = 'cons';
export const TKN_HD: OP_TOKEN = 'hd';
export const TKN_TL: OP_TOKEN = 'tl';
const OP_LIST: OP_TOKEN[] = [
	//Operations
	TKN_CONS,
	TKN_HD, TKN_TL,
];

//Token types
/**
 * Represents a symbol in the token list.
 */
export interface SYMBOL_TYPE {
	type: 'symbol';
	value: SYMBOL_TOKEN;
	pos: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface EXPR_TYPE {
	type: 'expression';
	value: EXPR_TOKEN;
	pos: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface OP_TYPE {
	type: 'operation';
	value: OP_TOKEN;
	pos: number;
}

/**
 * Represents an identifier (variable) in the token list.
 */
export interface IDENT_TYPE {
	type: 'identifier';
	value: string;
	pos: number;
}

/**
 * Represents an unknown identifier in the token list
 */
export interface UNKNOWN_TYPE {
	type: 'unknown';
	value: string;
	pos: number;
}

/**
 * Represents the end of the input file
 */
export interface EOI_TYPE {
	type: 'eoi',
	pos: number,
}

/**
 * The type of the elements of the token list returned by the lexer
 */
export type WHILE_TOKEN = SYMBOL_TYPE | EXPR_TYPE | OP_TYPE | IDENT_TYPE | EOI_TYPE | UNKNOWN_TYPE;
/**
 * Same as {@link WHILE_TOKEN} but without {@link EOI_TYPE}.
 */
export type INT_WHILE_TOKEN = SYMBOL_TYPE | EXPR_TYPE | OP_TYPE | IDENT_TYPE | UNKNOWN_TYPE;

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
 * @param pos
 */
function read_next_token(program: string, pos: number): INT_WHILE_TOKEN|null {
	//Attempt to read a symbol
	for (let sym of SYMBOL_LIST) {
		//Check each symbol against the start of the program string
		if (program.substr(0, sym.length) === sym) {
			//Return the symbol token if a match is found
			return {
				type: 'symbol',
				value: sym,
				pos,
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
				value: tkn,
				pos,
			};
		}
	}
	for (let tkn of OP_LIST) {
		if (expr === tkn) {
			return {
				type: 'operation',
				value: tkn,
				pos,
			};
		}
	}
	//Otherwise the token is an identifier name
	return {
		type: 'identifier',
		value: expr,
		pos,
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
	while (program.length) {
		const whitespace: RegExpMatchArray|null = program.match(/^\s+/);
		if (whitespace !== null) {
			let match = whitespace[0];
			pos += match.length;
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

			pos += index;
			program = program.substring(index);
			continue;
		}
		//Comment block (multiline/inline)
		if (program.substr(0, 2) == '(*') {
			//Ignore text to the end of the comment block
			let index = program.search(/\*\)/) || -1;
			if (index === -1) {
				//TODO: Handle missing end-of-block
				pos = program.length;
			} else {
				index += 2;
				pos += index;
			}
			program = program.substring(index);
			continue;
		}

		//Read the next token in the program
		let token: WHILE_TOKEN | null = read_next_token(program, pos);
		if (token === null) {
			//Mark unrecognised tokens
			token = {
				type: 'unknown',
				value: program.charAt(0),
				pos,
			};
		}
		//Save the token to the list
		res.push(token);
		//Remove the token from the start of the program
		pos += token.value.length;
		program = program.substring(token.value.length)
	}

	//Add an end-of-input marker
	res.push({
		type: 'eoi',
		pos: pos
	});
	//Return the produced token list
	return res;
}