import lexer, { LexerOptions } from "./lexer";
import parser from "./parser";
import { WHILE_TOKEN } from "../types/tokens";
import { ErrorType } from "../utils/errorManager";

/**
 * Parse a program string and return any errors discovered in the code
 * @param program		The program to parse
 */
export default function lint(program: string): ErrorType[] {
	let [tokens, lexErrors]: [WHILE_TOKEN[], ErrorType[]] = lexer(program);
	let [, parseErrors]: [unknown, ErrorType[]] = parser(tokens);

	return [
		...lexErrors,
		...parseErrors,
	];
}