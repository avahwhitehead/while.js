import Position from "./position";

//Symbols
export type SYMBOL_TOKEN = ';' | ':=' | '{' | '}' | '(' | ')';
export const TKN_SEP: SYMBOL_TOKEN = ';';
export const TKN_ASSGN: SYMBOL_TOKEN = ':=';
export const TKN_BLOCK_OPN: SYMBOL_TOKEN = '{';
export const TKN_BLOCK_CLS: SYMBOL_TOKEN = '}';
export const TKN_PREN_OPN: SYMBOL_TOKEN = '(';
export const TKN_PREN_CLS: SYMBOL_TOKEN = ')';

//Expressions/Atoms
export type EXPR_TOKEN = 'if' | 'else' | 'while' | 'read' | 'write';
export const TKN_IF: EXPR_TOKEN = 'if';
export const TKN_ELSE: EXPR_TOKEN = 'else';
export const TKN_WHILE: EXPR_TOKEN = 'while';
export const TKN_READ: EXPR_TOKEN = 'read';
export const TKN_WRITE: EXPR_TOKEN = 'write';

//Operations
export type OP_TOKEN = 'cons' | 'hd' | 'tl';
export const TKN_CONS: OP_TOKEN = 'cons';
export const TKN_HD: OP_TOKEN = 'hd';
export const TKN_TL: OP_TOKEN = 'tl';

//Token types
/**
 * Represents a symbol in the token list.
 */
export interface SYMBOL_TYPE {
	type: 'symbol';
	value: SYMBOL_TOKEN;
	pos: Position;
	length: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface EXPR_TYPE {
	type: 'expression';
	value: EXPR_TOKEN;
	pos: Position;
	length: number;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface OP_TYPE {
	type: 'operation';
	value: OP_TOKEN;
	pos: Position;
	length: number;
}

/**
 * Represents an identifier (variable) in the token list.
 */
export interface IDENT_TYPE {
	type: 'identifier';
	value: string;
	pos: Position;
	length: number;
}

/**
 * Represents an unknown identifier in the token list
 */
export interface UNKNOWN_TYPE {
	type: 'unknown';
	value: string;
	pos: Position;
	length: number;
}

/**
 * The type of the elements of the token list returned by the lexer
 */
export type WHILE_TOKEN = SYMBOL_TYPE | EXPR_TYPE | OP_TYPE | IDENT_TYPE | UNKNOWN_TYPE;