import lexer, { LexerOptions } from "./lexer";
import parser, { ParserOpts } from "./parser";
import { WHILE_TOKEN } from "../types/tokens";
import { WHILE_TOKEN_EXTD } from "../types/extendedTokens";
import { ErrorType } from "../utils/errorManager";

/**
 * Options to be provided to the linter
 */
export interface LinterOpts {
	/**
	 * Whether to parse the program as pure WHILE rather than extended
	 */
	pureOnly?: boolean;
	/**
	 * Options to pass to the lexer
	 */
	lexOpts?: LexerOptions;
	/**
	 * Options to pass to the parser
	 */
	parseOpts?: ParserOpts;
}

/**
 * Parse a program string and return any errors discovered in the code
 * @param program		The program to parse
 * @param props			Configuration options for the linter
 */
export default function lint(program: string, props?: LinterOpts): ErrorType[] {
	//Configure lexer and parser options
	let lexerOpts: LexerOptions = props?.lexOpts || {};
	let parseOpts: ParserOpts = props?.parseOpts || {};
	if (props?.pureOnly === true) {
		lexerOpts.pureOnly = true;
		parseOpts.pureOnly = true;
	}

	//Pass the program through the lexer and parer
	let [tokens, lexErrors]: [(WHILE_TOKEN|WHILE_TOKEN_EXTD)[], ErrorType[]] = lexer(program, lexerOpts);
	let [, parseErrors]: [unknown, ErrorType[]] = parser(tokens, parseOpts);

	//Combine the lexer and parser errors into a single list
	return [
		...lexErrors,
		...parseErrors,
	];
}