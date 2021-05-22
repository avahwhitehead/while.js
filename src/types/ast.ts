import { IDENT_TYPE, OP_TYPE } from "../linter/lexer";

//name read input { ... } write output
export type AST_PROG = {
	type: 'program',
	name: IDENT_TYPE,
	input: IDENT_TYPE,
	body: AST_CMD[],
	output: IDENT_TYPE,
};

//cons/hd/tl operations
export type AST_OP = {
	type: 'operation',
	op: OP_TYPE,
	args: AST_EXPR[],
}
export type AST_EXPR = AST_OP | IDENT_TYPE

//Assignment/If/While operations
export type AST_IF = {
	type: 'cond',
	condition: AST_EXPR,
	if: AST_CMD[],
	else: AST_CMD[],
};
export type AST_WHILE = {
	type: 'loop',
	condition: AST_EXPR,
	body: AST_CMD[],
};
export type AST_ASGN = {
	type: 'assign',
	ident: IDENT_TYPE,
	arg: AST_EXPR,
};
export type AST_CMD = AST_ASGN | AST_IF | AST_WHILE;