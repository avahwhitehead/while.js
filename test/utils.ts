import { BinaryTree } from "../src/types/Trees";

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
