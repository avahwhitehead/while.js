import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import { BinaryTree } from "../types/Trees";
import { StringBuilder } from "../utils/StringBuilder";

/**
 * Produce a program string from the stored program AST
 * @param prog		The program AST to display
 * @param indent	The character(s) to use to indicate a single indent.
 * 					Defaults to {@code '\t'} (a tab character).
 */
export default function displayProgram(prog: AST_PROG, indent: string = '\t'): string {
	let stringBuilder = new StringBuilder({indent: indent});
	stringBuilder
		.add(`${prog.name.value} read ${prog.input.value} {`)
		.break();

	if (prog.body.length === 0) stringBuilder.break();
	else _displayBody(prog.body, stringBuilder);

	stringBuilder.add(`} write ${prog.output.value}`);
	return stringBuilder.toString();
}

/**
 * Convert a list of AST commands to a program string
 * @param body			The list of commands to convert
 * @param builder	String Builder used to build the program
 */
function _displayBody(body: AST_CMD[], builder: StringBuilder): void {
	builder.indent();
	for (let [i, cmd] of body.entries()) {
		//Convert each command to a string
		_displayCmd(cmd, builder);
		//Add a line separator to the end of every line except the last one
		if (i < body.length - 1) builder.add(';');
		builder.break();
	}
	builder.dedent();
}

/**
 * Convert a single AST command to a program string
 * @param cmd		The command to convert
 * @param builder	String Builder used to build the program
 */
function _displayCmd(cmd: AST_CMD, builder: StringBuilder): void {
	switch (cmd.type) {
		case "assign":
			//Add a space after the assignment operator only if the expression doesn't already add one
			let expr = _displayExpr(cmd.arg);
			builder.add(cmd.ident.value)
			if (expr.charAt(0) === ' ') builder.add(' :=').add(expr);
			else builder.add(' := ').add(expr);
			return;
		case "cond":
			//The if statement and body
			builder.add(`if `).add(_displayExpr(cmd.condition)).add(' {').break();
			_displayBody(cmd.if, builder);
			//Display the else statement only if non-empty
			if (cmd.else.length > 0) {
				builder.add(`} else {`).break();
				_displayBody(cmd.else, builder);
			}
			builder.add('}');
			return;
		case "loop":
			builder.add(`while `).add(_displayExpr(cmd.condition)).add(` {`).break();
			_displayBody(cmd.body, builder);
			builder.add(`}`);
			return;
		case "switch":
			builder.add(`switch `).add(_displayExpr(cmd.condition)).add(` {`).break();
			builder.indent();
			for (let c of cmd.cases) {
				builder.add('case ').add(_displayExpr(c.cond)).add(':').break();
				_displayBody(c.body, builder);
			}
			builder.push('}').dedent();
			return;
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
 * Convert a binary tree to a program string representation.
 * By default, trees are displayed as cons operations.
 * @param tree		The list of commands to convert
 * @param pre		The string to use to "open" a tree
 * @param sep		The string to use to separate the two tree nodes
 * @param post		The string to use to "close" the tree
 * @example {@code displayTree(tn(5), '<', '.', '>')}	Displays the tree in <a.b> format
 * @returns {string}	The tree as a string
 * @private
 */
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
