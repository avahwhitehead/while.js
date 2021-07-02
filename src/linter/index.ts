import lexer, { LexerOptions } from "./lexer";
import parser, { ParserOpts } from "./parser";
import { WHILE_TOKEN } from "../types/tokens";
import { WHILE_TOKEN_EXTD } from "../types/extendedTokens";
import { ErrorType } from "../utils/errorManager";

/**
 * Parse a program string and return any errors discovered in the code
 * @param program		The program to parse
 * @param lexerOpts		Options to pass to the lexer
 * @param parseOpts		Options to pass to the parser
 */
export default function lint(program: string, lexerOpts?: LexerOptions, parseOpts?: ParserOpts): ErrorType[] {
	let [tokens, lexErrors]: [(WHILE_TOKEN|WHILE_TOKEN_EXTD)[], ErrorType[]] = lexer(program, lexerOpts);
	let [, parseErrors]: [unknown, ErrorType[]] = parser(tokens, parseOpts);

	return [
		...lexErrors,
		...parseErrors,
	];
}