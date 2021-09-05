import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import VariableManager from "./VariableManager";

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

/**
 * Class to perform operations on a program AST.
 */
export default class ProgramManager {
	private _props: ProgramManagerProps;
	private _prog: AST_PROG;
	private _variableManager: VariableManager;
	private _macros: Map<string, number>;

	/**
	 * @param prog		The program AST
	 * @param props		Additional constructor options
	 */
	public constructor(prog: AST_PROG, props?: ProgramManagerProps) {
		this._props = props || {};
		this._prog = prog;
		this._variableManager = new VariableManager();
		this._macros = new Map<string, number>();

		this._analyseProgram();
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
	public reanalyse() {
		this._variableManager = new VariableManager();
		this._macros = new Map<string, number>();
		this._analyseProgram();
	}

	/**
	 * Traverse the AST, collecting information about the program.
	 * @private
	 */
	private _analyseProgram(): this {
		//Save the program's input variable to the data
		this._analyseExpr(this._prog.input);
		//Iterate through the program body in order
		for (let cmd of this._prog.body) this._analyseCmd(cmd);
		//Save the program's output variable to the data
		this._analyseExpr(this._prog.output);
		return this;
	}

	/**
	 * Traverse a {@code AST_CMD}, collecting information about the program.
	 * Part of {@link this._analyseProgram}.
	 * @param cmd	The command to traverse.
	 * @private
	 */
	private _analyseCmd(cmd: AST_CMD): void {
		//Add the command to the stack
		let stack: AST_CMD[] = [cmd];

		while (stack.length > 0) {
			//Get the next command from the top of the stack
			let cmd: AST_CMD = stack.pop()!;

			switch (cmd.type) {
				case "assign":
					//Save the assigning variable
					this._analyseExpr(cmd.ident);
					//Analyse the assignee expression
					this._analyseExpr(cmd.arg);
					break;
				case "cond":
					//Analyse the condition's expression
					this._analyseExpr(cmd.condition);
					//Traverse the truthy body, then the falsy body
					_pushBodyToStack(stack, cmd.else);
					_pushBodyToStack(stack, cmd.if);
					break;
				case "loop":
					//Analyse the loop's condition expression
					this._analyseExpr(cmd.condition);
					//Traverse the loop's body
					_pushBodyToStack(stack, cmd.body);
					break;
				case "switch":
					//Analyse the loop's condition expression
					this._analyseExpr(cmd.condition);
					//Analyse the condition and body of each case statement
					for (let c of cmd.cases) {
						this._analyseExpr(c.cond);
						_pushBodyToStack(stack, c.body);
					}
					break;
			}
		}
	}

	/**
	 * Traverse a {@code AST_EXPR}, collecting information about the program.
	 * Part of {@link this._analyseProgram}.
	 * @param expr	The expression to traverse.
	 * @private
	 */
	private _analyseExpr(expr: AST_EXPR): void {
		let stack: AST_EXPR[] = [expr];

		while (stack.length > 0) {
			let expr = stack.pop()!;

			switch (expr.type) {
				case "identName":
					//Save the variable name in the manager
					if (expr.value !== 'nil') this._variableManager.add(expr.value, undefined, expr.value);
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
					//Analyse the input expression to the macro
					stack.push(expr.input);
					break;
				case "tree":
					//Nothing to analyse
					break;
			}
		}
	}
}
