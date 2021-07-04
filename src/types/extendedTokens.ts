import Position from "./position";
import { EXPR_TOKEN, OP_TOKEN, SYMBOL_TOKEN, WHILE_TOKEN } from "./tokens";

//Symbols
export type SYMBOL_TOKEN_EXTD = SYMBOL_TOKEN | '=' | ',' | '.' | ':' | '[' | ']' | '<' | '>';
export const TKN_EQL: SYMBOL_TOKEN_EXTD = '=';
export const TKN_LIST_OPN: SYMBOL_TOKEN_EXTD = '[';
export const TKN_LIST_CLS: SYMBOL_TOKEN_EXTD = ']';
export const TKN_MCRO_OPN: SYMBOL_TOKEN_EXTD = '<';
export const TKN_MCRO_CLS: SYMBOL_TOKEN_EXTD = '>';
export const TKN_COMMA: SYMBOL_TOKEN_EXTD = ',';
export const TKN_DOT: SYMBOL_TOKEN_EXTD = '.';
export const TKN_COLON: SYMBOL_TOKEN_EXTD = ':';

//Expressions/Atoms
export type EXPR_TOKEN_EXTD = EXPR_TOKEN | 'switch' | 'case' | 'default';
export const TKN_SWITCH: EXPR_TOKEN_EXTD = 'switch';
export const TKN_CASE: EXPR_TOKEN_EXTD = 'case';
export const TKN_DEFAULT: EXPR_TOKEN_EXTD = 'default';

//Operations
export type OP_TOKEN_EXTD = OP_TOKEN | 'true' | 'false';
export const TKN_TRUE: OP_TOKEN_EXTD = 'true';
export const TKN_FALSE: OP_TOKEN_EXTD = 'false';

//Token types
/**
 * Represents a symbol in the token list of an extended while program.
 */
export interface SYMBOL_TYPE_EXTD {
	type: 'symbol';
	value: SYMBOL_TOKEN_EXTD;
	pos: Position;
	endPos: Position;
	length: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list of an extended while program.
 */
export interface EXPR_TYPE_EXTD {
	type: 'expression';
	value: EXPR_TOKEN_EXTD;
	pos: Position;
	endPos: Position;
	length: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list of an extended while program.
 */
export interface OP_TYPE_EXTD {
	type: 'operation';
	value: OP_TOKEN_EXTD;
	pos: Position;
	endPos: Position;
	length: number;
}

export interface NUMBER_TYPE {
	type: 'number',
	value: number,
	pos: Position,
	endPos: Position,
	length: number;
}

/**
 * The type of the elements of the token list returned by the lexer for an extended WHILE program
 */
export type WHILE_TOKEN_EXTD = WHILE_TOKEN | SYMBOL_TYPE_EXTD | EXPR_TYPE_EXTD | OP_TYPE_EXTD | NUMBER_TYPE;