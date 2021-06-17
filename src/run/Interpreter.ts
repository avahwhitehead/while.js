import { AST_ASGN, AST_CMD, AST_EXPR, AST_IF, AST_PROG, AST_PROG_PARTIAL, AST_WHILE } from "../types/ast";
import { BinaryTree } from "../types/Trees";
import lexer from "../linter/lexer";
import parser from "../linter/parser";
import { ErrorType } from "../utils/errorManager";
import { OP_TYPE } from "../types/tokens";

/**
 * Constructor options for the {@link Interpreter} class
 */
export interface InterpreterProps {

}

type AST_BLOCK = {
	type: 'block',
	body: AST_CMD[],
}
type EXEC_AST_PROG = {
	type: 'program',
	body: AST_BLOCK,
}
type EXEC_AST_CMD = AST_ASGN|AST_BLOCK|AST_IF|AST_WHILE|EXEC_AST_PROG;

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
 * An interpreter for a WHILE program.
 */
export default class Interpreter {
	private _props: InterpreterProps;
	private _input: BinaryTree;
	private _program: AST_PROG;
	private readonly _store: Map<string, BinaryTree>;

	private _commandStack: EXEC_AST_CMD[];
	private _exprStack: EXEC_AST_EXPR[];

	/**
	 * Create an Interpreter object from a program string.
	 * The program is parsed, and given to a new Interpreter object if everything succeeded.
	 * @param program		The program string to run
	 * @param inputTree		Input tree to pass to the program
	 * @param props			Extra properties to pass when initialising the Interpreter
	 */
	public static parse(program: string, inputTree: BinaryTree, props?: InterpreterProps): { success: true, interpreter: Interpreter }|{ success: false, errors: ErrorType[] } {
		//Pass the program through the lexer and parer
		let [tokenList,] = lexer(program);
		let [ast, errors]: [(AST_PROG | AST_PROG_PARTIAL), ErrorType[]] = parser(tokenList);

		if (ast.complete) {
			//Create and return an interpreter
			return {
				success: true,
				interpreter: new Interpreter(ast, inputTree, props)
			};
		}
		//Return the errors if the program couldn't be parsed completely
		return {
			success: false,
			errors: errors,
		};
	}

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

		this._exprStack = [];

		this._commandStack = [{
			type: 'block',
			body: [...this._program.body],
		}];
	}

	/**
	 * Run the program until it has finished executing.
	 * @returns	BinaryTree	The value of the output variable at the end of execution
	 */
	public run(): BinaryTree {
		//Evaluate the command stack from its current state.
		this._runCommandStack();
		//Return the output variable value
		return this._store.get(this._program.output.value) || null;
	}

	public get store(): Map<string, BinaryTree> {
		return this._store;
	}

	public get ast(): AST_PROG {
		return this._program;
	}

	/**
	 * Evaluate an expression.
	 * This is hd/tl/cons operations, and reading variable (identifier) values.
	 * These do not affect the variable store.
	 * @param expr	The expression to evaluate.
	 * @private
	 */
	private _evalExpr(expr: AST_EXPR): BinaryTree {
		let exprStack: EXEC_AST_EXPR[] = this._exprStack;
		exprStack.push({
			type: 'root',
			args: [expr]
		});
		exprStack.push(this._copyExpr(expr));

		this._evalExprStack();

		//The root expression object will not be popped during evaluation
		//The expression stack will have been evaluated until the root's argument (the input expression) is evaluated
		let root: EXEC_AST_ROOT = exprStack.pop() as EXEC_AST_ROOT;
		//Return the tree
		return (root.args[0] as Literal).tree;
	}

	/**
	 * Evaluate the command stack until it is empty.
	 * @private
	 */
	private _runCommandStack(): void {
		while (this._commandStack.length > 0) {
			//Read the next command from the top of the stack
			let op = this._commandStack.pop()!;

			if (op.type === "assign") {
				//Evaluate the right-side of the assignment
				let val = this._evalExpr(op.arg);
				//Store in the variable
				this._store.set(op.ident.value, val);
			} else if (op.type === "cond") {
				//Evaluate the condition
				if (this._evalExpr(op.condition) !== null) {
					//Add the if block to the stack to be executed
					this._commandStack.push({
						type: 'block',
						body: [...op.if]
					});
				} else {
					//Add the else block to the stack to be executed
					this._commandStack.push({
						type: 'block',
						body: [...op.else]
					});
				}
			} else if (op.type === "loop") {
				//Evaluate the condition
				if (this._evalExpr(op.condition) !== null) {
					//Add the loop to the top of the stack so it is checked again later
					this._commandStack.push(op);
					//Evaluate the loop body once
					this._commandStack.push({
						type: 'block',
						body: [...op.body]
					});
				}
			} else if (op.type === "block") {
				//Read the first command from the block
				let first: AST_CMD | undefined = op.body.shift();
				//Add the block to the stack if it is not finished
				if (op.body.length > 0) this._commandStack.push(op);
				//Add the command to the stack if it exists
				if (first !== undefined) this._commandStack.push(first);
			} else {
				throw new Error(`Unexpected operation type '${op.type}'`);
			}
		}
	}

	/**
	 * Evaluate the expression stack until it is empty
	 * @private
	 */
	private _evalExprStack(): void {
		while (this._exprStack.length > 1) {
			//Read the next expression from the top of the stack
			let curr: EXEC_AST_EXPR = this._exprStack.pop()!;

			if (curr.type === "operation") {
				//Check to see if the operation's arguments have all been evaluated
				let evaled = true;
				for (let arg of curr.args) {
					if (arg.type !== 'literal') {
						//If not, add the next one to the top of the stack to be evaluated
						this._exprStack.push(curr);
						this._exprStack.push(this._copyExpr(arg));
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
					this._replaceArgWithLiteral(val);
				}
			} else if (curr.type === "identifier") {
				//If the expression is an identifier (nil/a variable in the program)...
				if (curr.value === 'nil') {
					//Hard code `nil` as a value
					this._replaceArgWithLiteral(null);
				} else {
					//Otherwise look it up in the store, using nil as a fallback
					this._replaceArgWithLiteral(this._store.get(curr.value) || null);
				}
			} else {
				//Unknown expression type
				throw new Error(`Unknown expression token '${curr!.type}'`);
			}
		}
	}

	/**
	 * Produce a copy of an expression AST node so that it can be modified without affecting the original.
	 * @param expr	The expression to copy.
	 * @private
	 */
	private _copyExpr(expr: AST_EXPR|EXEC_AST_EXPR): EXEC_AST_EXPR {
		let copy: EXEC_AST_EXPR = {...expr};
		if (copy.type === 'root' || copy.type === 'operation') {
			//Recreate the object's argument list to prevent overwriting the original when it's changed
			copy.args = [...copy.args]
		}
		return copy;
	}

	/**
	 * Replace the first non-literal argument of the expression at the top of {@link exprStack} with a literal value.
	 * @param val	The literal value to assign in place of the argument
	 */
	private _replaceArgWithLiteral(val: BinaryTree) {
		//Read the parent expression from the stack
		let par = this._exprStack.pop() as {
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
		this._exprStack.push(par);
	}
}