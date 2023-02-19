import Position from "./position";

// ================
// Atoms
// ================

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

// ================
// Tokens
// ================

interface TOKEN {
	type: string;
	value: any,
	length: number;
	pos: Position;
	endPos: Position;
}

//Token types
/**
 * Represents a symbol in the token list.
 */
export interface SYMBOL_TYPE extends TOKEN {
	type: 'symbol';
	value: SYMBOL_TOKEN;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface EXPR_TYPE extends TOKEN {
	type: 'expression';
	value: EXPR_TOKEN;
}

/**
 * Represents an expression (e.g. cons/hd/if/...) in the token list.
 */
export interface OP_TYPE extends TOKEN {
	type: 'operation';
	value: OP_TOKEN;
}

/**
 * Represents an identifier (variable) in the token list.
 */
export interface IDENT_TYPE extends TOKEN {
	type: 'identifier';
	value: string;
}

/**
 * Represents a comment in the token list
 */
export interface COMMENT_TYPE extends TOKEN {
	type: 'comment',
	value: string,
}

/**
 * Represents an unknown identifier in the token list
 */
export interface UNKNOWN_TYPE extends TOKEN {
	type: 'unknown';
	value: string;
}

/**
 * The type of the elements of the token list returned by the lexer
 */
export type WHILE_TOKEN = SYMBOL_TYPE | EXPR_TYPE | OP_TYPE | IDENT_TYPE | COMMENT_TYPE | UNKNOWN_TYPE;