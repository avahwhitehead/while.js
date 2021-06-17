import { IDENT_TYPE, OP_TYPE } from "./tokens";

//name read input { ... } write output
export type AST_PROG = {
	type: 'program',
	complete: true,
	name: IDENT_TYPE,
	input: IDENT_TYPE,
	body: AST_CMD[],
	output: IDENT_TYPE,
};
export type AST_PROG_PARTIAL = {
	type: 'program',
	complete: false,
	name: IDENT_TYPE | null,
	input: IDENT_TYPE | null,
	body: (AST_CMD|AST_CMD_PARTIAL|null)[] | null,
	output: IDENT_TYPE | null,
};

//cons/hd/tl operations
export type AST_OP = {
	type: 'operation',
	complete: true,
	op: OP_TYPE,
	args: AST_EXPR[],
};
export type AST_OP_PARTIAL = {
	type: 'operation',
	complete: false,
	op: OP_TYPE|null,
	args: (AST_EXPR|AST_EXPR_PARTIAL|null)[],
}
export type AST_EXPR = AST_OP | IDENT_TYPE;
export type AST_EXPR_PARTIAL = AST_OP_PARTIAL | IDENT_TYPE;

//Assignment/If/While operations
export type AST_IF = {
	type: 'cond',
	complete: true,
	condition: AST_EXPR,
	if: AST_CMD[],
	else: AST_CMD[],
}
export type AST_IF_PARTIAL = {
	type: 'cond',
	complete: false,
	condition: AST_EXPR|AST_EXPR_PARTIAL|null,
	if: (AST_CMD|AST_CMD_PARTIAL|null)[],
	else: (AST_CMD|AST_CMD_PARTIAL|null)[],
};

export type AST_WHILE = {
	type: 'loop',
	complete: true,
	condition: AST_EXPR,
	body: AST_CMD[],
}
export type AST_WHILE_PARTIAL = {
	type: 'loop',
	complete: false,
	condition: AST_EXPR|AST_EXPR_PARTIAL|null,
	body: (AST_CMD|AST_CMD_PARTIAL|null)[],
};

export type AST_ASGN = {
	type: 'assign',
	complete: true,
	ident: IDENT_TYPE,
	arg: AST_EXPR,
}
export type AST_ASGN_PARTIAL = {
	type: 'assign',
	complete: false,
	ident: IDENT_TYPE|null,
	arg: AST_EXPR|AST_EXPR_PARTIAL|null,
};
export type AST_CMD = AST_ASGN | AST_IF | AST_WHILE;
export type AST_CMD_PARTIAL = AST_ASGN_PARTIAL | AST_IF_PARTIAL | AST_WHILE_PARTIAL;
