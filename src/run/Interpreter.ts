import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import { BinaryTree } from "../types/Trees";
import { OP_TYPE } from "../linter/lexer";

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
	 * This is hd/tl/cons operations, and reading variable (identifier) values.
	 * These do not affect the variable store.
	 * @param expr	The expression to evaluate.
	 * @private
	 */
	private _evalExpr(expr: AST_EXPR): BinaryTree {
		/**
		 * Type definition for holding a literal binary tree in an expression.
		 */
		type Literal = {
			type: 'literal',
			tree: BinaryTree
		}
		/**
		 * Type definition for a partially evaluated expression in the expression stack.
		 * This is the same as {@link AST_EXPR} but also allowing {@link Literal} types in place of expressions.
		 */
		type EXEC_AST_EXPR = EXEC_AST_ROOT|{
			type: 'operation',
			op: OP_TYPE,
			args: (AST_EXPR | Literal)[],
		}|{
			type: 'identifier',
			value: string,
		};
		type EXEC_AST_ROOT = {
			type: 'root',
			args: (AST_EXPR | Literal)[],
		};

		/**
		 * Replace the first non-literal argument of the expression at the top of {@link exprStack} with a literal value.
		 * @param val	The literal value to assign in place of the argument
		 */
		function _replaceArgWithLiteral(val: BinaryTree) {
			//Read the parent expression from the stack
			let par = exprStack.pop() as {
				type: 'operation',
				op: OP_TYPE,
				args: (AST_EXPR | Literal)[],
			};

			for (let i = 0; i < par.args.length; i++) {
				//Find the first non-literal argument
				if (par.args[i].type !== 'literal') {
					//Replace it with the value argument
					par.args[i] = {
						type: 'literal',
						tree: val
					};
					//Stop after 1 replace
					break;
				}
			}
			//Add the parent expression back onto the stack
			exprStack.push(par);
		}
		function _copyExpr(expr: AST_EXPR|EXEC_AST_EXPR): EXEC_AST_EXPR {
			let copy: EXEC_AST_EXPR = {...expr};
			if (copy.type === 'root' || copy.type === 'operation') {
				//Recreate the object's argument list to prevent overwriting the original when it's changed
				copy.args = [...copy.args]
			}
			return copy;
		}

		let exprStack: EXEC_AST_EXPR[] = [{
			type: 'root',
			args: [expr]
		}, _copyExpr(expr)];

		while (exprStack.length > 1) {
			//Read the next expression from the top of the stack
			let curr: EXEC_AST_EXPR = exprStack.pop()!;

			if (curr.type === "operation") {
				//Check to see if the operation's arguments have all been evaluated
				let evaled = true;
				for (let arg of curr.args) {
					if (arg.type !== 'literal') {
						//If not, add the next one to the top of the stack to be evaluated
						exprStack.push(curr);
						exprStack.push(_copyExpr(arg));
						evaled = false;
						break;
					}
				}
				//If the operation's arguments have all been evaluated
				//Then evaluate the expression itself using the arguments
				if (evaled) {
					let val: BinaryTree;
					let args = curr.args as Literal[];
					switch (curr.op.value) {
						case "cons":
							//Evaluate the left and right arguments
							val = {
								left: args[0].tree,
								right: args[1].tree
							};
							break;
						case "hd":
							//Return the left side of the tree, using `nil` if the value is already `nil`
							val = args[0].tree?.left || null;
							break;
						case "tl":
							//Return the right side of the tree, using `nil` if the value is already `nil`
							val = args[0].tree?.right || null;
							break;
						default:
							//Unknown expression type
							throw new Error(`Unknown operation token '${curr.type}'`);
					}
					//Save the value as the first argument of the parent expression
					_replaceArgWithLiteral(val);
				}
			} else if (curr.type === "identifier") {
				//If the expression is an identifier (nil/a variable in the program)...
				if (curr.value === 'nil') {
					//Hard code `nil` as a value
					_replaceArgWithLiteral(null);
				} else {
					//Otherwise look it up in the store, using nil as a fallback
					_replaceArgWithLiteral(this._store.get(curr.value) || null);
				}
			} else {
				//Unknown expression type
				throw new Error(`Unknown expression token '${expr!.type}'`);
			}
		}
		//The root expression object will not be popped during evaluation
		//The expression stack will have been evaluated until the root's argument (the input expression) is evaluated
		let root: EXEC_AST_ROOT = exprStack.pop() as EXEC_AST_ROOT;
		//Return the tree
		return (root.args[0] as Literal).tree;
	}
}