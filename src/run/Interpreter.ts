import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import { BinaryTree } from "../types/Trees";

/**
 * Constructor options for the {@link Interpreter} class
 */
export interface InterpreterProps {

}

/**
 * An interpreter for a WHILE program.
 */
export default class Interpreter {
	private _props: InterpreterProps;
	private _input: BinaryTree;
	private _program: AST_PROG;
	private readonly _store: Map<string, BinaryTree>;

	/**
	 * @param ast	AST of the program, as produced by the while parser
	 * @param input	Binary tree to pass as input to the program
	 * @param props	Initialisation configuration parameters
	 */
	public constructor(ast: AST_PROG, input: BinaryTree, props?: InterpreterProps) {
		this._program = ast;
		this._input = input;
		this._props = props || {};
		this._store = new Map<string, BinaryTree>();
		this._store.set(ast.input.value, input);
	}

	/**
	 * Run the program from start to end.
	 * The variable store is cleared (and populated with the input variable) before running.
	 * @returns	BinaryTree	The value of the output variable at the end of execution
	 */
	public run(): BinaryTree {
		//Reset the store to its initial state
		this._store.clear();
		this._store.set(this._program.input.value, this._input);
		//Run program block
		this._runBlock(this._program.body);
		//Return the output variable's value
		return this._store.get(this._program.output.value) || null;
	}

	/**
	 * Run a block of statements.
	 * E.g. a while loop body, if/else blocks, ...
	 * @param block	The block of statements to execute.
	 * @private
	 */
	private _runBlock(block: AST_CMD[]): void {
		for (let stmt of block) {
			this._runStatement(stmt);
		}
	}

	/**
	 * Run a single statement.
	 * This is a loop, condition, or assignment.
	 * @param stmt	The statement to execute
	 * @private
	 */
	private _runStatement(stmt: AST_CMD): void {
		if (stmt.type === 'cond') {
			//Evaluate the condition
			let condition = this._evalExpr(stmt.condition);
			//Evaluate the else block if the condition is 'nil'
			if (condition === null) this._runBlock(stmt.else);
			//Otherwise run the if block
			else this._runBlock(stmt.if);
		} else if (stmt.type === 'assign') {
			this._store.set(stmt.ident.value, this._evalExpr(stmt.arg));
		} else if (stmt.type === 'loop') {
			while (true) {
				//Evaluate the condition
				let condition = this._evalExpr(stmt.condition);
				//Exit the loop if the condition is nil
				if (condition === null) break;
				//Evaluate the loop block if the condition is 'nil'
				this._runBlock(stmt.body);
			}
		} else {
			//Error on unknown type (shouldn't occur)
			throw new Error(`Unknown statement token '${stmt!.type}'`);
		}
	}

	/**
	 * Evaluate an expression.
	 * This is hd/tl/cons operations, and reading variable values.
	 * These do not affect the variable store.
	 * @param expr	The expression to evaluate.
	 * @private
	 */
	private _evalExpr(expr: AST_EXPR): BinaryTree {
		if (expr.type === 'identifier') {
			//Hard code `nil` as a value
			if (expr.value === 'nil') return null;
			//Otherwise look it up in the store, using nil as a fallback
			return this._store.get(expr.value) || null;
		} else if (expr.type === 'operation') {
			//Evaluate the operation
			switch (expr.op.value) {
				case "cons":
					//Evaluate the left and right arguments
					return {
						left: this._evalExpr(expr.args[0]),
						right: this._evalExpr(expr.args[1])
					};
				case "hd":
					//Return the left side of the tree, using `nil` if the value is already `nil`
					return this._evalExpr(expr.args[0])?.left || null;
				case "tl":
					//Return the right side of the tree, using `nil` if the value is already `nil`
					return this._evalExpr(expr.args[0])?.right || null;
				default:
					//Unknown expression type
					throw new Error(`Unknown operation token '${expr.type}'`);
			}
		}
		//Unknown expression type
		throw new Error(`Unknown expression token '${expr!.type}'`);
	}
}