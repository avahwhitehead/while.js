import {
	AST_ASGN,
	AST_CMD,
	AST_EXPR,
	AST_EXPR_TREE,
	AST_IDENT_NAME,
	AST_IF,
	AST_LIST,
	AST_MACRO,
	AST_OP,
	AST_PROG,
	AST_SWITCH,
	AST_SWITCH_CASE,
	AST_SWITCH_DEFAULT,
	AST_TREE
} from "../types/ast";
import VariableManager from "./VariableManager";
import NameGenerator from "./NameGenerator";
import { BinaryTree } from "../types/Trees";
import astEquals from "../tools/astEquals";

/**
 * Reverse a list, and add it to the end of a stack.
 * Useful for ordered DFS traversal of an AST (for e.g. ordered variable renaming).
 * @param stack		The stack
 * @param body		The list of data to add
 */
function _pushBodyToStack<T>(stack: T[], body: T[]): void {
	for (let i = body.length - 1; i >= 0; --i) {
		stack.push(body[i]);
	}
}

/**
 * Constructor options for creating a {@link ProgramManager}.
 */
export interface ProgramManagerProps {

}

interface MacroPosition {
	expr: AST_MACRO;
	parent_cmd: AST_CMD;
	parent_body: AST_CMD[];
}

/**
 * Class to perform operations on a program AST.
 */
export default class ProgramManager {
	private _props: ProgramManagerProps;
	private _prog: AST_PROG;
	private _variableManager: VariableManager;
	private _variablePositions: Map<string, AST_IDENT_NAME[]>;
	private _macros: Map<string, number>;
	private _macroPositions: Map<string, MacroPosition[]>;

	/**
	 * @param prog		The program AST
	 * @param props		Additional constructor options
	 */
	public constructor(prog: AST_PROG, props?: ProgramManagerProps) {
		this._props = props || {};
		this._prog = prog;

		this._variableManager = new VariableManager();
		this._variablePositions = new Map<string, AST_IDENT_NAME[]>();
		this._macros = new Map<string, number>();
		this._macroPositions = new Map<string, MacroPosition[]>();

		this.reanalyse();
	}

	/**
	 * Get the variable manager representing the program in its current state
	 */
	public get variableManager(): VariableManager {
		return this._variableManager;
	}

	public get variables(): Set<string> {
		return this.variableManager.variables;
	}

	/**
	 * Get a list of all the macros in the program
	 * @returns {string[]}	List of the names of each macro referenced in the program
	 */
	public get macros(): string[] {
		return Array.from(this._macros.keys());
	}

	/**
	 * Get a list of all the macros in the program, and the number of occurrences of each
	 * @returns {[string, number][]}	List where each macro is of the format [macroName, occurrenceCount]
	 */
	public get macroCounts(): Map<string, number> {
		return new Map(this._macros.entries());
	}

	/**
	 * Get the program being managed by this object
	 */
	public get prog(): AST_PROG {
		return this._prog;
	}

	/**
	 * Change the program being managed by this object.
	 * {@link this.reanalyse} is called automatically.
	 * @param prog	The new program to manage.
	 */
	public setProg(prog: AST_PROG): void {
		this._prog = prog;
		this.reanalyse();
	}

	/**
	 * Manually trigger a refresh of the program state.
	 * Useful if the AST object has been updated.
	 */
	public reanalyse(): void {
		this._variableManager = new VariableManager();
		this._macros = new Map<string, number>();
		this._macroPositions = new Map<string, MacroPosition[]>();
		this._analyseProgram();
	}

	/**
	 * Replace the first occurrence of a macro call with the code from its program.
	 * @param macro				The AST to replace the macro call with
	 * @param name				(Optional) The name of the macro to replace.
	 * 							Defaults to {@code macro.name.value}
	 * @param convertToPure		Whether to convert the macro to pure WHILE before inserting it
	 */
	public replaceMacro(macro: AST_PROG, name?: string, convertToPure: boolean = false): void {
		//Use the macro name as the variable namespace, unless the namespace already exists
		let namespace: string = this.variableManager.namespaceExists(macro.name.value)
			? this.variableManager.getNewNamespace()
			: macro.name.value;

		//TODO: Allow refactoring macros other than the first in the list
		let macroPositions = this._macroPositions.get(name || macro.name.value);
		if (!macroPositions) return;
		let macroPosition: MacroPosition = macroPositions[0];

		//Macro expression is of type AST_MACRO here, but needs to be declared as type `any` so it can be changed to `AST_IDENT_NAME` after the refactor
		let macroExpr: any = macroPosition.expr;

		let macroManager: ProgramManager = new ProgramManager(macro);

		//Convert the macro to pure WHILE if requested
		if (convertToPure) macroManager.toPure();

		for (let v of macroManager.variables) {
			let newName = this.variableManager.add(v, namespace);
			macroManager.renameVariable(v, newName);
		}

		//Expression to assign the macro input to a variable
		let pre: AST_ASGN = {
			type: 'assign',
			complete: true,
			ident: {type:'identName', value: macro.input.value},
			arg: (macroExpr as AST_MACRO).input,
		};
		//Insert the macro code into the program body directly before the macro call expression
		let index = macroPosition.parent_body.indexOf(macroPosition.parent_cmd);
		macroPosition.parent_body.splice(index, 0, pre, ...macro.body);

		//Set/remove the properties to convert from an AST_MACRO to an AST_IDENT_NAME
		delete macroExpr.program;
		delete macroExpr.input;
		delete macroExpr.complete;

		macroExpr.type = 'identName';
		macroExpr.value = macro.output.value;

		this.reanalyse();
	}

	public renameVariable(oldname: string, newname: string) {
		//Get all the positions where the variable is referenced
		let positions = this._variablePositions.get(oldname);
		if (positions === undefined) return;
		//Rename the variable at all points
		positions.forEach(p => p.value = newname);

		//Remove the old name from the variable manager and add under the new name
		this.variableManager.delete(oldname);
		this.variableManager.add(newname);

		//Remove the positions from the old name to the new name
		this._variablePositions.delete(oldname);
		let newpos = this._variablePositions.get(newname) || [];
		newpos.push(...positions);
		this._variablePositions.set(newname, newpos);
	}

	public displayProgram(indent: string = '\t'): string {
		let r: [number, string][] = [[0, `${this._prog.name.value} read ${this._prog.input.value} {`]];
		if (this._prog.body.length === 0) r.push([0, '']);
		else r.push(...this._displayBody(this._prog.body, 1));
		r.push([0, `} write ${this._prog.output.value}`]);
		return r.map(e => indent.repeat(e[0]) + e[1]).join('\n');
	}

	/**
	 * Traverse the AST, collecting information about the program.
	 * @private
	 */
	private _analyseProgram(): this {
		//Save the program's input variable
		this._analyseExpr(this._prog.input, this._prog, this._prog.body);
		//Iterate through the program body in order
		for (let cmd of this._prog.body) this._analyseCmd(cmd, this._prog.body);
		//Save the program's output variable
		this._analyseExpr(this._prog.output, this._prog, this._prog.body);

		return this;
	}

	/**
	 * Traverse a {@code AST_CMD}, collecting information about the program.
	 * Part of {@link this._analyseProgram}.
	 * @param cmd			The command to traverse.
	 * @param parentBody	The code "body" (list of commands) containing this command.
	 * 						For use with {@link this._macroPositions}
	 * @private
	 */
	private _analyseCmd(cmd: AST_CMD, parentBody: AST_CMD[]): void {
		//Add the command to the stack
		let stack: AST_CMD[] = [cmd];

		while (stack.length > 0) {
			//Get the next command from the top of the stack
			let cmd: AST_CMD = stack.pop()!;

			switch (cmd.type) {
				case "assign":
					//Save the assigning variable
					this._analyseExpr(cmd.ident, cmd, parentBody);
					//Analyse the assignee expression
					this._analyseExpr(cmd.arg, cmd, parentBody);
					break;
				case "cond":
					//Analyse the condition's expression
					this._analyseExpr(cmd.condition, cmd, parentBody);
					//Traverse the truthy body, then the falsy body
					_pushBodyToStack(stack, cmd.else);
					_pushBodyToStack(stack, cmd.if);
					break;
				case "loop":
					//Analyse the loop's condition expression
					this._analyseExpr(cmd.condition, cmd, parentBody);
					//Traverse the loop's body
					_pushBodyToStack(stack, cmd.body);
					break;
				case "switch":
					//Analyse the loop's condition expression
					this._analyseExpr(cmd.condition, cmd, parentBody);
					//Analyse the condition and body of each case statement
					for (let c of cmd.cases) {
						this._analyseExpr(c.cond, cmd, parentBody);
						_pushBodyToStack(stack, c.body);
					}
					break;
			}
		}
	}

	/**
	 * Traverse a {@code AST_EXPR}, collecting information about the program.
	 * Part of {@link this._analyseProgram}.
	 * @param expr			The expression to traverse.
	 * @param parentCommand	The command which contains this expression.
	 * 						For use with {@link this._macroPositions} and {@link this._variablePositions}.
	 * @param parentBody	The code "body" (list of commands) containing {@code parentCommand}.
	 * 						For use with {@link this._macroPositions}
	 * @private
	 */
	private _analyseExpr(expr: AST_EXPR, parentCommand: AST_CMD|AST_PROG, parentBody: AST_CMD[]): void {
		let stack: AST_EXPR[] = [expr];

		while (stack.length > 0) {
			let expr = stack.pop()!;

			switch (expr.type) {
				case "identName":
					//Save the variable name in the manager
					if (expr.value !== 'nil') {
						this._variableManager.add(expr.value, undefined, expr.value);
						let list = this._variablePositions.get(expr.value);
						if (list === undefined) this._variablePositions.set(expr.value, list = []);
						list.push(expr);
					}
					break;
				case "operation":
					//Analyse each of the operation's arguments
					_pushBodyToStack(stack, expr.args);
					break;
				case "equal":
					//Analyse the left argument, then the right argument
					stack.push(expr.arg2);
					stack.push(expr.arg1);
					break;
				case "list":
					//Analyse each element of the list
					_pushBodyToStack(stack, expr.elements);
					break;
				case "tree_expr":
					//Analyse the left-side of the tree, then the right side
					stack.push(expr.right);
					stack.push(expr.left);
					break;
				case "macro":
					//Add the program macro to the store
					this._macros.set(expr.program, (this._macros.get(expr.program) || 0) + 1);
					let pos: MacroPosition[]|undefined = this._macroPositions.get(expr.program);
					if (pos === undefined) this._macroPositions.set(expr.program, pos = []);
					pos.push({
						expr,
						parent_body: parentBody,
						//Only variables can be assigned directly by an AST_PROG
						parent_cmd: parentCommand as AST_CMD,
					});
					//Analyse the input expression to the macro
					stack.push(expr.input);
					break;
				case "tree":
					//Nothing to analyse
					break;
			}
		}
	}

	/**
	 * Convert a list of AST commands to a program string
	 * @param body		The list of commands to convert
	 * @param indent	The current indent level
	 * @returns	{[number, string][]} List of lists, where each sublist represents a line in the program.
	 * 							The first element is the indent level of the line, and the second element is the line itself.
	 * @private
	 */
	private _displayBody(body: AST_CMD[], indent: number): [number, string][] {
		let res: [number, string][] = [];
		for (let [i, cmd] of body.entries()) {
			//Convert each command to a string
			res.push(...this._displayCmd(cmd, indent));
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
	private _displayCmd(cmd: AST_CMD, indent: number): [number, string][] {
		let r: [number, string][] = [];
		switch (cmd.type) {
			case "assign":
				let s: string;
				//Add a space after the assignment operator only if the expression doesn't already add one
				if (this._displayExpr(cmd.arg).charAt(0) === ' ') s = `${cmd.ident.value} :=${(this._displayExpr(cmd.arg))}`;
				else s = `${cmd.ident.value} := ${(this._displayExpr(cmd.arg))}`;
				return [[indent, s]];
			case "cond":
				//The if statement and body
				r.push([indent, `if ${this._displayExpr(cmd.condition)} {`]);
				r.push(...this._displayBody(cmd.if, indent + 1));
				//Display the else statement only if non-empty
				if (cmd.else.length > 0) {
					r.push([indent, `} else {`]);
					r.push(...this._displayBody(cmd.else, indent + 1));
				}
				r.push([indent, `}`]);
				return r;
			case "loop":
				r.push([indent, `while ${this._displayExpr(cmd.condition)} {`]);
				r.push(...this._displayBody(cmd.body, indent + 1));
				r.push([indent, `}`]);
				return r;
			case "switch":
				r.push([indent, `switch (${this._displayExpr(cmd.condition)}) {`]);
				for (let c of cmd.cases) {
					r.push([indent + 1, `case ${this._displayExpr(c.cond)}:`]);
					r.push(...this._displayBody(c.body, indent + 2));
				}
				r.push([indent, `}`]);
				return r;
		}
	}

	/**
	 * Convert an AST expression to a program string
	 * @param expr		The expression to display as a string
	 * @returns	{string} The expression as a strings
	 * @private
	 */
	private _displayExpr(expr: AST_EXPR): string {
		switch (expr.type) {
			case "identName":
				return expr.value;
			case "operation":
				return `${expr.op.value} ${expr.args.map(c => this._displayExpr(c)).join(' ')}`;
			case "equal":
				return `${this._displayExpr(expr.arg1)} = ${expr.arg2}`;
			case "list":
				return `[${expr.elements.map(c => this._displayExpr(c)).join(', ')}]`;
			case "tree_expr":
				return `<${this._displayExpr(expr.left)}.${this._displayExpr(expr.right)}>`;
			case "tree":
				return this._displayTree(expr.tree);
			case "macro":
				return `<${expr.program}> ${this._displayExpr(expr.input)}`;
		}
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
	// private _displayTree(tree: BinaryTree, pre='<', sep='.', post='>'): string {
	private _displayTree(tree: BinaryTree, pre='cons ', sep=' ', post=''): string {
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

	/**
	 * Convert the program's AST to pure WHILE.
	 * The resulting AST will have the same semantics as the original program.
	 * @returns {this}	This ProgramManager object
	 */
	public toPure(): this {
		//Get a unique macro name to use for replacing the equals expressions in the code
		let equalsMacroName: string;
		let nameGenerator = new NameGenerator();
		do {
			equalsMacroName = nameGenerator.next();
		} while (this.macroCounts.has(equalsMacroName));

		//Convert the program body to pure
		this._bodyToPure(this._prog.body, equalsMacroName);

		//Reanalyse the AST since the tree may have changed
		this.reanalyse();

		//Replace each of the equality macros with the actual code
		while (this.macroCounts.has(equalsMacroName)) {
			this.replaceMacro(astEquals, equalsMacroName);
		}

		//Return the manager
		return this;
	}

	/**
	 * Convert an AST_BODY element to pure WHILE
	 * @param body				The body to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _bodyToPure(body: AST_CMD[], equalsMacroName: string): AST_CMD[] {
		for (let cmd of body) this._cmdToPure(cmd, equalsMacroName);
		return body;
	}

	/**
	 * Convert a `cmd` command to pure WHILE
	 * @param cmd				The cmd to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _cmdToPure(cmd: AST_CMD, equalsMacroName: string): AST_CMD {
		switch (cmd.type) {
			case "assign":
				cmd.arg = this._exprToPure(cmd.arg, equalsMacroName);
				break;
			case "cond":
				cmd.condition = this._exprToPure(cmd.condition, equalsMacroName);
				cmd.if = cmd.if.map(c => this._cmdToPure(c, equalsMacroName));
				cmd.else = cmd.else.map(c => this._cmdToPure(c, equalsMacroName));
				break;
			case "loop":
				cmd.condition = this._exprToPure(cmd.condition, equalsMacroName);
				cmd.body = cmd.body.map(c => this._cmdToPure(c, equalsMacroName));
				break;
			case "switch":
				this._switchToPure(cmd, equalsMacroName);
				break;
		}

		return cmd;
	}

	/**
	 * Convert a `switch` command to pure WHILE
	 * @param sw				The switch to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _switchToPure(sw: AST_SWITCH, equalsMacroName: string): AST_IF {
		//Save the switch condition expression, and the cases and default block
		let condition: AST_EXPR = sw.condition;
		let cases: AST_SWITCH_CASE[] = sw.cases;
		let dflt: AST_SWITCH_DEFAULT = sw.default;

		//Restructure the switch object into an IF statement
		let root: AST_IF = sw as any;
		root.type = 'cond';
		root.else = [];
		delete (root as any).cases;
		delete (root as any).default;
		delete (root as any).condition;

		if (cases.length === 0) {
			//If there are no cases, all cases should fall into the "default" block
			//TODO: Is it possible to remove `if nil` condition and just return the code body?
			root.condition = { type: 'tree', complete: true, tree: null };
			root.if = [];
		} else {
			//Otherwise, the root condition should be comparing the switch's input
			//with the first case's condition
			root.condition = this._exprToPure({
				type: 'equal',
				complete: true,
				arg1: condition,
				arg2: cases[0].cond,
			}, equalsMacroName);
			root.if = this._bodyToPure(cases[0].body, equalsMacroName);
		}

		//Travel through the switch adding each case to the last condition's else block
		//The first case is skipped because it has already been set to the root (if it exists)
		let prevIf: AST_IF = root;
		for (let i = 1; i < cases.length; i++) {
			const c: AST_SWITCH_CASE = cases[i];
			//The if statement for this case
			let cond: AST_IF = {
				type: 'cond',
				complete: true,
				//Compare the condition with the switch's input expression
				condition: this._exprToPure({
					type: 'equal',
					complete: true,
					arg1: condition,
					arg2: c.cond,
				}, equalsMacroName),
				//Case body goes here
				if: this._bodyToPure(c.body, equalsMacroName),
				//Else statement to be populated with the next case, or the default statement
				else: [],
			}
			//Add this condition to the previous if's else block
			prevIf.else.push(cond);
			//Save this if statement to be accessed as the next condition's parent
			prevIf = cond;
		}

		//Set the final else block to the default case's body
		prevIf.else = this._bodyToPure(dflt.body, equalsMacroName);

		//Return the root condition
		return root;
	}

	/**
	 * Convert a `list` command to pure WHILE
	 * @param lst				The list to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _listToPure(lst: AST_LIST, equalsMacroName: string): AST_OP|AST_TREE {
		let res: AST_OP|AST_TREE = {type: 'tree', complete: true, tree: null};
		for (let i = lst.elements.length - 1; i >= 0; --i) {
			res = {
				type: 'operation',
				complete: true,
				op: {type: 'opToken', value: 'cons'},
				args: [
					this._exprToPure(lst.elements[i], equalsMacroName),
					res
				],
			};
		}
		return res;
	}

	/**
	 * Convert a `expr` command to pure WHILE
	 * @param expr				The expr to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _exprToPure(expr: AST_EXPR, equalsMacroName: string): AST_EXPR {
		switch (expr.type) {
			case "identName":
				break;
			case "operation":
				for (let i = 0; i < expr.args.length; i++) {
					expr.args[i] = this._exprToPure(expr.args[i], equalsMacroName);
				}
				break;
			case "equal":
				return {
					type: 'macro',
					complete: true,
					program: equalsMacroName,
					input: {
						type: 'operation',
						complete: true,
						op: {type: 'opToken', value: 'cons'},
						args: [this._exprToPure(expr.arg1, equalsMacroName), this._exprToPure(expr.arg2, equalsMacroName)]
					},
				};
			case "list":
				return this._listToPure(expr, equalsMacroName);
			case "tree_expr":
				return this._treeExprToPure(expr, equalsMacroName);
			case "tree":
				return this._treeToPure(expr.tree);
			case "macro":
				expr.input = this._exprToPure(expr.input, equalsMacroName);
				break;
		}
		return expr;
	}

	/**
	 * Convert a `treeExpr` command to pure WHILE
	 * @param tree	The treeExpr to convert
	 * @param equalsMacroName	Name of the macro replacing equals operations
	 * @private
	 */
	private _treeExprToPure(tree: AST_EXPR_TREE, equalsMacroName: string): AST_OP {
		return {
			type: 'operation',
			complete: true,
			op: { type:'opToken', value: 'cons' },
			args: [
				this._exprToPure(tree.left, equalsMacroName),
				this._exprToPure(tree.right, equalsMacroName),
			],
		}
	}

	/**
	 * Convert a binary tree to pure WHILE
	 * @param tree	The tree to convert
	 * @private
	 */
	private _treeToPure(tree: BinaryTree): AST_OP|AST_TREE {
		function nil(): AST_TREE {
			return {
				type: 'tree',
				complete: true,
				tree: null
			};
		}

		if (tree === null) return nil();

		let treeStack: BinaryTree[] = [];
		let opStack: AST_OP[] = [];

		treeStack.push(tree);
		const root: AST_OP = {
			type: 'operation',
			complete: true,
			op: {type: 'opToken', value: 'cons'},
			args: [],
		};
		opStack.push(root);

		function _addChildTree(subtree: BinaryTree, op: AST_OP, opStack: AST_OP[], treeStack: BinaryTree[]): void {
			if (subtree === null) {
				op.args.push(nil());
				return;
			}
			let child: AST_OP = {
				type: 'operation',
				complete: true,
				op: {type: 'opToken', value: 'cons'},
				args: [],
			};
			op.args.push(child);
			opStack.push(child);
			treeStack.push(subtree);
		}

		while (opStack.length > 0) {
			let tree: BinaryTree = treeStack.pop()!;
			let op: AST_OP = opStack.pop()!;

			if (op.args.length === 0) {
				treeStack.push(tree);
				opStack.push(op);
				_addChildTree(tree.left, op, opStack, treeStack);
			} else if (op.args.length === 1) {
				_addChildTree(tree.right, op, opStack, treeStack);
			} else {
				//This subtree is finished
				//Keep going back up
			}
		}
		return root;
	}
}
