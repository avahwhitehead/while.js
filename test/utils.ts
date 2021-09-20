import { BinaryTree, ErrorType } from "../src";
import {
	EXPR_TOKEN,
	EXPR_TYPE,
	IDENT_TYPE,
	OP_TOKEN,
	OP_TYPE,
	SYMBOL_TOKEN,
	SYMBOL_TYPE,
	UNKNOWN_TYPE
} from "../src/types/tokens";
import Position from "../src/types/position";
import {
	EXPR_TOKEN_EXTD,
	EXPR_TYPE_EXTD,
	NUMBER_TYPE,
	OP_TOKEN_EXTD,
	OP_TYPE_EXTD,
	SYMBOL_TOKEN_EXTD,
	SYMBOL_TYPE_EXTD,
} from "../src/types/extendedTokens";
import { AST_PROG, AST_TREE } from "../src/types/ast";
import { parseProgram } from "../src/linter";
import { expect } from "chai";

//Useful functions

/**
 * Convert a program string to an AST_PROG object, expecting it to parse without issue.
 * @param prog	The program string to convert
 */
export function expectParseProgram(prog: string): AST_PROG {
	let [ast,err] = parseProgram(prog);
	//Make sure there were no parsing errors
	expect(err).to.deep.equal([]);
	expect(ast.complete).to.be.true;
	//Return the AST
	return ast as AST_PROG;
}

/**
 * Convert a binary tree to its string representation (for displaying)
 * @param tree	The tree to convert
 */
export function treeToString(tree: BinaryTree): string {
	if (tree === null) return `nil`;
	return `<${treeToString(tree.left)}.${treeToString(tree.right)}>`
}

/**
 * Convert a number to a tree
 * @param n	The number to convert
 */
export function tn(n: number) : BinaryTree {
	if (n === 0) return null;
	return t(null, tn(n-1));
}

/**
 * Shorthand function for building a tree
 * @param l	The left-hand child
 * @param r	The right-hand child
 */
export function t(l: BinaryTree|number, r: BinaryTree|number): BinaryTree {
	return {
		left: (typeof l === 'number' ? tn(l) : l),
		right: (typeof r === 'number' ? tn(r) : r),
	};
}

/**
 * Produce an array tree-representation from a list of elements
 * @param elements	The elements to use, in order
 * @returns	Converted array-tree made of the provided elements
 */
export function a(...elements: (BinaryTree|number)[]): BinaryTree {
	const els: BinaryTree[] = elements.map((e) => {
		if (typeof e === 'number') return tn(e);
		return e;
	});

	let tree = null;
	for (let i = els.length - 1; i >= 0; i--) {
		tree = {
			left: els[i],
			right: tree,
		}
	}

	return tree;
}

/**
 * Wrap a {@link BinaryTree} object in an {@link AST_TREE}.
 * @param t	The tree to wrap
 */
export function tree(t: BinaryTree): AST_TREE {
	return {
		type: 'tree',
		complete: true,
		tree: t
	}
}


export function sym(t: SYMBOL_TOKEN, pos: Position): SYMBOL_TYPE;
export function sym(t: SYMBOL_TOKEN, pos: number, col: number): SYMBOL_TYPE;
export function sym(t: SYMBOL_TOKEN, pos: Position|number, col?: number): SYMBOL_TYPE {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'symbol',
		value: t,
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function e_sym(t: SYMBOL_TOKEN_EXTD, pos: Position): SYMBOL_TYPE_EXTD;
export function e_sym(t: SYMBOL_TOKEN_EXTD, pos: number, col: number): SYMBOL_TYPE_EXTD;
export function e_sym(t: SYMBOL_TOKEN_EXTD, pos: Position|number, col?: number): SYMBOL_TYPE_EXTD {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'symbol',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function expr(t: EXPR_TOKEN, pos: Position): EXPR_TYPE;
export function expr(t: EXPR_TOKEN, pos: number, col: number): EXPR_TYPE;
export function expr(t: EXPR_TOKEN, pos: Position|number, col?: number): EXPR_TYPE {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'expression',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function e_expr(t: EXPR_TOKEN_EXTD, pos: Position): EXPR_TYPE_EXTD;
export function e_expr(t: EXPR_TOKEN_EXTD, pos: number, col: number): EXPR_TYPE_EXTD;
export function e_expr(t: EXPR_TOKEN_EXTD, pos: Position|number, col?: number): EXPR_TYPE_EXTD {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'expression',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function opr(t: OP_TOKEN, pos: Position): OP_TYPE;
export function opr(t: OP_TOKEN, pos: number, col: number): OP_TYPE;
export function opr(t: OP_TOKEN, pos: Position|number, col?: number): OP_TYPE {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'operation',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function e_opr(t: OP_TOKEN_EXTD, pos: Position): OP_TYPE_EXTD;
export function e_opr(t: OP_TOKEN_EXTD, pos: number, col: number): OP_TYPE_EXTD;
export function e_opr(t: OP_TOKEN_EXTD, pos: Position|number, col?: number): OP_TYPE_EXTD {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'operation',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function idnt(t: string, pos: Position): IDENT_TYPE;
export function idnt(t: string, pos: number, col: number): IDENT_TYPE;
export function idnt(t: string, pos: Position|number, col?: number): IDENT_TYPE {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'identifier',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length
	};
}

export function ukwn(t: string, pos: Position): UNKNOWN_TYPE;
export function ukwn(t: string, pos: number, col: number): UNKNOWN_TYPE;
export function ukwn(t: string, pos: Position|number, col?: number): UNKNOWN_TYPE {
	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + t.length };
	return {
		type: 'unknown',
		value: t,
		//@ts-ignore
		pos: startPos,
		endPos,
		length: t.length,
	};
}

export function nmbr(v: number, t: string, pos: Position): NUMBER_TYPE;
export function nmbr(v: number, t: string, pos: number, col: number): NUMBER_TYPE;
export function nmbr(v: number, t: string, pos: Position|number, col?: number): NUMBER_TYPE {
	let length: number;
	if (v === 0) length = 1;
	else length = Math.floor(Math.log10(v)) + 1;

	let startPos: Position = (typeof pos === 'number') ? { row: pos, col: col!} : pos;
	let endPos: Position = { row: startPos.row, col: startPos.col + length };
	return {
		type: 'number',
		value: v,
		token: t,
		pos: startPos,
		endPos,
		length
	};
}


export function error(msg: string, pos: Position, endPos?: Position): ErrorType;
export function error(msg: string, pos: number, col: number): ErrorType;
export function error(msg: string, pos: number, col: number, endRow: number, endCol: number): ErrorType;
export function error(msg: string, pos: Position|number, col?: number|Position, endRow?: number, endCol?: number): ErrorType {
	let start: Position;
	if (typeof pos === 'number') {
		start = {
			row: pos,
			col: col as number,
		};
	} else {
		start = pos;
	}

	let end: Position|undefined = undefined;
	if (typeof col === "number") {
		if (endRow !== undefined) {
			end = {
				row: endRow,
				col: endCol as number,
			};
		}
	} else {
		end = col;
	}

	if (end === undefined) {
		return {
			message: msg,
			position: start,
		};
	}
	return {
		message: msg,
		position: start,
		endPos: end,
	};
}