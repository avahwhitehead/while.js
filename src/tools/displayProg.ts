import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import { BinaryTree } from "../types/Trees";

/**
 * Produce a program string from the stored program AST
 * @param indent	The character(s) to use to indicate a single indent.
 * 					Defaults to {@code '\t'} (a tab character).
 */
export default function displayProgram(prog: AST_PROG, indent: string = '\t'): string {
	let r: [number, string][] = [[0, `${prog.name.value} read ${prog.input.value} {`]];
	if (prog.body.length === 0) r.push([0, '']);
	else r.push(..._displayBody(prog.body, 1));
	r.push([0, `} write ${prog.output.value}`]);
	return r.map(e => indent.repeat(e[0]) + e[1]).join('\n');
}

/**
 * Convert a list of AST commands to a program string
 * @param body		The list of commands to convert
 * @param indent	The current indent level
 * @returns	{[number, string][]} List of lists, where each sublist represents a line in the program.
 * 							The first element is the indent level of the line, and the second element is the line itself.
 * @private
 */
function _displayBody(body: AST_CMD[], indent: number): [number, string][] {
	let res: [number, string][] = [];
	for (let [i, cmd] of body.entries()) {
		//Convert each command to a string
		res.push(..._displayCmd(cmd, indent));
		//Add a line separator to the end of every line except the last one
		if (i < body.length - 1) res[res.length - 1][1] += ';'
	}
	return res;
}

/**
 * Convert a single AST command to a program string
 * @param cmd		The command to convert
 * @param indent	The current indent level
 * @returns	{[number, string][]} List of lists, where each sublist represents a line in the program.
 * 							The first element is the indent level of the line, and the second element is the line itself.
 * @private
 */
function _displayCmd(cmd: AST_CMD, indent: number): [number, string][] {
	let r: [number, string][] = [];
	switch (cmd.type) {
		case "assign":
			let s: string;
			//Add a space after the assignment operator only if the expression doesn't already add one
			if (_displayExpr(cmd.arg).charAt(0) === ' ') s = `${cmd.ident.value} :=${(_displayExpr(cmd.arg))}`;
			else s = `${cmd.ident.value} := ${(_displayExpr(cmd.arg))}`;
			return [[indent, s]];
		case "cond":
			//The if statement and body
			r.push([indent, `if ${_displayExpr(cmd.condition)} {`]);
			r.push(..._displayBody(cmd.if, indent + 1));
			//Display the else statement only if non-empty
			if (cmd.else.length > 0) {
				r.push([indent, `} else {`]);
				r.push(..._displayBody(cmd.else, indent + 1));
			}
			r.push([indent, `}`]);
			return r;
		case "loop":
			r.push([indent, `while ${_displayExpr(cmd.condition)} {`]);
			r.push(..._displayBody(cmd.body, indent + 1));
			r.push([indent, `}`]);
			return r;
		case "switch":
			r.push([indent, `switch (${_displayExpr(cmd.condition)}) {`]);
			for (let c of cmd.cases) {
				r.push([indent + 1, `case ${_displayExpr(c.cond)}:`]);
				r.push(..._displayBody(c.body, indent + 2));
			}
			r.push([indent, `}`]);
			return r;
	}
}

/**
 * Convert an AST expression to a program string
 * @param expr		The expression to display as a string
 * @param brackets	Add brackets around this expression.
 * 					This setting is ignored (treated false) if the expression is `nil` or an identifier.
 * @returns	{string} The expression as a strings
 * @private
 */
function _displayExpr(expr: AST_EXPR, brackets?: boolean): string {
	let res: string;
	switch (expr.type) {
		case "identName":
			res = expr.value;
			break;
		case "operation":
			res = `${expr.op.value} ${expr.args.map(c => _displayExpr(c, expr.args.length > 1)).join(' ')}`;
			break;
		case "equal":
			res = `${_displayExpr(expr.arg1)} = ${expr.arg2}`;
			break;
		case "list":
			res = `[${expr.elements.map(c => _displayExpr(c)).join(', ')}]`;
			break;
		case "tree_expr":
			res = `<${_displayExpr(expr.left)}.${_displayExpr(expr.right)}>`;
			break;
		case "tree":
			res = _displayTree(expr.tree);
			break;
		case "macro":
			res = `<${expr.program}> ${_displayExpr(expr.input)}`;
			break;
	}

	//Only add brackets if requested, and if the expression is complex enough to need them
	if (!brackets
		|| expr.type === 'identName'
		|| expr.type === 'tree' && expr.tree === null
	) return res;
	//Wrap the produced string in parentheses
	return '(' + res + ')';
}

/**
 * Convert a binary tree to a program string representation
 * @param tree		The list of commands to convert
 * @param pre		The string to use to "open" a tree
 * @param sep		The string to use to separate the two tree nodes
 * @param post		The string to use to "close" the tree
 * @returns {string}	The tree as a string
 * @private
 */
// function _displayTree(tree: BinaryTree, pre='<', sep='.', post='>'): string {
function _displayTree(tree: BinaryTree, pre='cons ', sep=' ', post=''): string {
	if (tree === null) return 'nil';

	let res: string = '';
	//Go depth-first through the tree building up the string
	let stack: [BinaryTree, boolean][] = [[tree, false]];
	while (stack.length) {
		let [tree, isRight]: [BinaryTree, boolean] = stack.pop()!;

		if (tree === null) {
			//Display the nil node
			res += 'nil';
			//Close the tree if required
			if (isRight) res += post;
			//Otherwise add the separator
			else res += sep;
		} else {
			//Open a new tree
			res += pre;
			//Convert the left side before the right side
			stack.push([tree.right, true]);
			stack.push([tree.left, false]);
		}
	}
	return res;
}
