import { IDENT_TYPE } from "./tokens";
import { OP_TYPE_EXTD } from "./extendedTokens";
import { BinaryTree } from "./Trees";

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

export type AST_OP_EQL = {
	type: 'equal',
	complete: true,
	arg1: AST_EXPR,
	arg2: AST_EXPR,
};
export type AST_OP_EQL_PARTIAL = {
	type: 'equal',
	complete: false,
	arg1: AST_EXPR|AST_EXPR_PARTIAL|null,
	arg2: AST_EXPR|AST_EXPR_PARTIAL|null,
};

export type AST_TREE = {
	type: 'tree',
	tree: BinaryTree,
}

export type AST_LIST = {
	type: 'list',
	complete: true,
	elements: AST_EXPR[],
}
export type AST_LIST_PARTIAL = {
	type: 'list',
	complete: false,
	elements: (AST_EXPR|AST_EXPR_PARTIAL|null)[],
}

//cons/hd/tl operations
export type AST_OP = {
	type: 'operation',
	complete: true,
	op: OP_TYPE_EXTD,
	args: AST_EXPR[],
};
export type AST_OP_PARTIAL = {
	type: 'operation',
	complete: false,
	op: OP_TYPE_EXTD|null,
	args: (AST_EXPR|AST_EXPR_PARTIAL|null)[],
}
export type AST_EXPR = AST_OP | AST_OP_EQL | AST_LIST | AST_TREE | IDENT_TYPE;
export type AST_EXPR_PARTIAL = AST_OP_PARTIAL | AST_OP_EQL_PARTIAL | AST_LIST_PARTIAL | AST_TREE | IDENT_TYPE;

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

export type AST_SWITCH_DEFAULT = {
	type: 'switch_default',
	complete: true,
	body: AST_CMD[]
}
export type AST_SWITCH_DEFAULT_PARTIAL = {
	type: 'switch_default',
	complete: false,
	body: (AST_CMD|AST_CMD_PARTIAL|null)[],
}
export type AST_SWITCH_CASE = {
	type: 'switch_case',
	complete: true,
	cond: AST_EXPR,
	body: AST_CMD[]
}
export type AST_SWITCH_CASE_PARTIAL = {
	type: 'switch_case',
	complete: false,
	cond: AST_EXPR|AST_EXPR_PARTIAL|null,
	body: (AST_CMD|AST_CMD_PARTIAL|null)[],
}

export type AST_SWITCH = {
	type: 'switch',
	complete: true,
	condition: AST_EXPR,
	cases: AST_SWITCH_CASE[],
	default: AST_SWITCH_DEFAULT,
}
export type AST_SWITCH_PARTIAL = {
	type: 'switch',
	complete: false,
	condition: AST_EXPR|AST_EXPR_PARTIAL|null,
	cases: (AST_SWITCH_CASE|AST_SWITCH_CASE_PARTIAL|null)[],
	default: AST_SWITCH_DEFAULT|AST_SWITCH_DEFAULT_PARTIAL|null,
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
export type AST_CMD = AST_ASGN | AST_IF | AST_WHILE | AST_SWITCH;
export type AST_CMD_PARTIAL = AST_ASGN_PARTIAL | AST_IF_PARTIAL | AST_WHILE_PARTIAL | AST_SWITCH_PARTIAL;
