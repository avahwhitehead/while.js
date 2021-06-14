import { BinaryTree } from "../src/types/Trees";
import {
	EXPR_TOKEN,
	EXPR_TYPE,
	IDENT_TYPE,
	OP_TOKEN,
	OP_TYPE,
	SYMBOL_TOKEN,
	SYMBOL_TYPE,
	UNKNOWN_TYPE
} from "../src/linter/lexer";
import Position from "../src/types/position";

//Useful functions

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


export function sym(t: SYMBOL_TOKEN, pos: Position): SYMBOL_TYPE;
export function sym(t: SYMBOL_TOKEN, pos: number, col: number): SYMBOL_TYPE;
export function sym(t: SYMBOL_TOKEN, pos: Position|number, col?: number): SYMBOL_TYPE {
	return {
		type: 'symbol',
		value: t,
		//@ts-ignore
		pos: (typeof pos === 'number') ? { row: pos, col: col } : pos,
	};
}
export function expr(t: EXPR_TOKEN, pos: Position): EXPR_TYPE;
export function expr(t: EXPR_TOKEN, pos: number, col: number): EXPR_TYPE;
export function expr(t: EXPR_TOKEN, pos: Position|number, col?: number): EXPR_TYPE {
	return {
		type: 'expression',
		value: t,
		//@ts-ignore
		pos: (typeof pos === 'number') ? { row: pos, col: col } : pos,
	};
}
export function opr(t: OP_TOKEN, pos: Position): OP_TYPE;
export function opr(t: OP_TOKEN, pos: number, col: number): OP_TYPE;
export function opr(t: OP_TOKEN, pos: Position|number, col?: number): OP_TYPE {
	return {
		type: 'operation',
		value: t,
		//@ts-ignore
		pos: (typeof pos === 'number') ? { row: pos, col: col } : pos,
	};
}
export function idnt(t: string, pos: Position): IDENT_TYPE;
export function idnt(t: string, pos: number, col: number): IDENT_TYPE;
export function idnt(t: string, pos: Position|number, col?: number): IDENT_TYPE {
	return {
		type: 'identifier',
		value: t,
		//@ts-ignore
		pos: (typeof pos === 'number') ? { row: pos, col: col } : pos,
	};
}
export function ukwn(t: string, pos: Position): UNKNOWN_TYPE;
export function ukwn(t: string, pos: number, col: number): UNKNOWN_TYPE;
export function ukwn(t: string, pos: Position|number, col?: number): UNKNOWN_TYPE {
	return {
		type: 'unknown',
		value: t,
		//@ts-ignore
		pos: (typeof pos === 'number') ? { row: pos, col: col } : pos,
	};
}