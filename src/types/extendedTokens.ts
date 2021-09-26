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

//Programs as data
export type PAD_TOKEN = '@asgn' | '@:=' | '@doAsgn' | '@while' | '@doWhile' | '@if' | '@doIf' | '@var' | '@quote' | '@hd' | '@doHd' | '@tl' | '@doTl' | '@cons' | '@doCons';
export const TKN_PAD_ASSIGN: PAD_TOKEN = '@asgn';
export const TKN_PAD_ASSIGN_1: PAD_TOKEN = '@:=';
export const TKN_PAD_DO_ASSIGN: PAD_TOKEN = '@doAsgn';
export const TKN_PAD_WHILE: PAD_TOKEN = '@while';
export const TKN_PAD_DO_WHILE: PAD_TOKEN = '@doWhile';
export const TKN_PAD_IF: PAD_TOKEN = '@if';
export const TKN_PAD_DO_IF: PAD_TOKEN = '@doIf';
export const TKN_PAD_VAR: PAD_TOKEN = '@var';
export const TKN_PAD_QUOTE: PAD_TOKEN = '@quote';
export const TKN_PAD_HD: PAD_TOKEN = '@hd';
export const TKN_PAD_DO_HD: PAD_TOKEN = '@doHd';
export const TKN_PAD_TL: PAD_TOKEN = '@tl';
export const TKN_PAD_DO_TL: PAD_TOKEN = '@doTl';
export const TKN_PAD_CONS: PAD_TOKEN = '@cons';
export const TKN_PAD_DO_CONS: PAD_TOKEN = '@doCons';

//Accept the programs-as-data atoms using the HWhile numerical representations
export const PAD_VALUES: {[key: string]: number} = {
	'@asgn': 2,		//TKN_PAD_ASSIGN
	'@:=': 2,		//TKN_PAD_ASSIGN_1
	'@doAsgn': 3,	//TKN_PAD_DO_ASSIGN
	'@while': 5,	//TKN_PAD_WHILE
	'@doWhile': 7,	//TKN_PAD_DO_WHILE
	'@if': 11,		//TKN_PAD_IF
	'@doIf': 13,	//TKN_PAD_DO_IF
	'@var': 17,		//TKN_PAD_VAR
	'@quote': 19,	//TKN_PAD_QUOTE
	'@hd': 23,		//TKN_PAD_HD
	'@doHd': 29,	//TKN_PAD_DO_HD
	'@tl': 31,		//TKN_PAD_TL
	'@doTl': 37,	//TKN_PAD_DO_TL
	'@cons': 41,	//TKN_PAD_CONS
	'@doCons': 43,	//TKN_PAD_DO_CONS
};

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