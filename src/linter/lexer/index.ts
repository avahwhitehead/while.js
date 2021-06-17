import Position, { incrementPos } from "../../types/position";
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
function read_next_token(program: string, pos: Position): WHILE_TOKEN|null {
	//Attempt to read a symbol
	for (let sym of SYMBOL_LIST) {
		//Check each symbol against the start of the program string
		if (program.substr(0, sym.length) === sym) {
			//Return the symbol token if a match is found
			return {
				type: 'symbol',
				value: sym,
				pos: {...pos},
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
	let pos: Position = { row:0, col:0 };
	//Hold the produced token list
	let res: WHILE_TOKEN[] = [];

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
		let token: WHILE_TOKEN | null = read_next_token(program, {...pos});
		if (token === null) {
			//Mark unrecognised tokens
			token = {
				type: 'unknown',
				value: program.charAt(0),
				pos: {...pos},
			};
		}
		//Save the token to the list
		res.push(token);
		//Remove the token from the start of the program
		incrementPos(pos, token.value);
		program = program.substring(token.value.length)
	}
	//Return the produced token list
	return res;
}