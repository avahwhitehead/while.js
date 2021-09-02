import {
	AST_ASGN,
	AST_CMD,
	AST_EXPR,
	AST_IDENT_NAME,
	AST_IF,
	AST_OP_TOKEN,
	AST_PROG,
	AST_PROG_PARTIAL,
	AST_SWITCH,
	AST_WHILE
} from "../types/ast";
import { BinaryTree } from "../types/Trees";
import lexer, { LexerOptions } from "../linter/lexer";
import parser, { ParserOpts } from "../linter/parser";
import { ErrorType } from "../utils/errorManager";
import { LinterOpts } from "../linter";

/**
 * Constructor options for the {@link Interpreter} class
 */
export interface InterpreterProps extends LinterOpts {

}

type AST_BLOCK = {
	type: 'block',
	body: AST_CMD[],
}
type EXEC_AST_PROG = {
	type: 'program',
	body: AST_BLOCK,
}
type EXEC_AST_CMD = AST_ASGN|AST_BLOCK|AST_IF|AST_WHILE|AST_SWITCH|EXEC_AST_PROG;

/**
 * Type definition for holding a literal binary tree in an expression.
 */
type Literal = {
	type: 'literal',
	tree: BinaryTree
}

type EXEC_AST_TREE = {
	type: 'tree_expr',
	left: (AST_EXPR|EXEC_AST_TREE|Literal),
	right: (AST_EXPR|EXEC_AST_TREE|Literal),
}
/**
 * Type definition for a partially evaluated expression in the expression stack.
 * This is the same as {@link AST_EXPR} but also allowing {@link Literal} types in place of expressions.
 */
type EXEC_AST_EXPR = EXEC_AST_ROOT|{
	type: 'operation',
	op: AST_OP_TOKEN,
	args: (AST_EXPR | Literal)[],
}|AST_IDENT_NAME|{
	type: 'equal',
	arg1: (AST_EXPR | Literal),
	arg2: (AST_EXPR | Literal),
}
|EXEC_AST_TREE
|{
	type: 'tree',
	tree: BinaryTree,
}|{
	type: 'list',
	elements: (AST_EXPR | Literal)[],
}|{
	type: 'macro',
	program: string,
	input: AST_EXPR | Literal,
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
		let lexerOpts: LexerOptions = props?.lexOpts || {};
		let parseOpts: ParserOpts = props?.parseOpts || {};
		if (props?.pureOnly === true) {
			lexerOpts.pureOnly = true;
			parseOpts.pureOnly = true;
		}

		//Pass the program through the lexer and parer
		let [tokenList, lexerErrors] = lexer(program, props?.lexOpts);
		let [ast, parseErrors]: [(AST_PROG | AST_PROG_PARTIAL), ErrorType[]] = parser(tokenList, props?.parseOpts);

		//Combine the lexer and parser errors into a single list
		let errors: ErrorType[] = [...lexerErrors, ...parseErrors];

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
	 * Check whether two {@link BinaryTree}s are equal.
	 * That is, they represent the same tree.
	 * Comparing two trees with {@code ===} or {@code ==} may return false even if the trees mean the same thing.
	 * Comparison is done with a depth-first search.
	 * @param s	The first tree to compare
	 * @param t	The second tree to compare
	 * @returns {@code true} if the two trees are equal
	 */
	public static treeEquals(s: BinaryTree, t: BinaryTree): boolean {
		let sNodes: BinaryTree[] = [s];
		let tNodes: BinaryTree[] = [t];
		while (sNodes.length > 0) {
			//Read the fist node from the stacks
			let sn: BinaryTree = sNodes.shift()!;
			let tn: BinaryTree = tNodes.shift()!;
			//Nodes are equal
			if (sn === null && tn === null) continue;
			//Nodes are both trees
			if (sn !== null && tn !== null) {
				//Compare the left and right nodes
				sNodes.push(sn.left, sn.right);
				tNodes.push(tn.left, tn.right);
			} else if (sn !== tn) {
				//One node is a tree, the other isn't
				//Therefore the trees are different
				return false;
			}
		}
		//The trees are equal here
		return true;
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
		exprStack.push(Interpreter._copyExpr(expr));

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
			} else if (op.type === "switch") {
				//Evaluate the condition
				let condition: BinaryTree = this._evalExpr(op.condition);
				let caseFound = false;
				for (let cse of op.cases) {
					let caseCond: BinaryTree = this._evalExpr(cse.cond);
					if (Interpreter.treeEquals(condition, caseCond)) {
						caseFound = true;
						//Add the if block to the stack to be executed
						this._commandStack.push({
							type: 'block',
							body: [...cse.body]
						});
					}
				}
				if (!caseFound) {
					//Add the if block to the stack to be executed
					this._commandStack.push({
						type: 'block',
						body: [...op.default.body]
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
						this._exprStack.push(Interpreter._copyExpr(arg));
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
			} else if (curr.type === "equal") {
				if (curr.arg1.type !== 'literal') {
					//Evaluate the first argument if it has not already been done
					this._exprStack.push(curr);
					this._exprStack.push(Interpreter._copyExpr(curr.arg1));
				} else if (curr.arg2.type !== 'literal') {
					//Evaluate the second argument if it has not already been done
					this._exprStack.push(curr);
					this._exprStack.push(Interpreter._copyExpr(curr.arg2));
				} else {
					//Evaluate the expression using the arguments
					//Save the produced tree in the first free argument of the parent expression
					if (Interpreter.treeEquals(curr.arg1.tree, curr.arg2.tree)) {
						this._replaceArgWithLiteral({
							left: null,
							right: null,
						});
					} else {
						this._replaceArgWithLiteral(null);
					}
				}
			} else if (curr.type === "tree_expr") {
				if (curr.left.type !== 'literal') {
					this._exprStack.push(curr);
					this._exprStack.push(Interpreter._copyExpr(curr.left));
				} else if (curr.right.type !== 'literal') {
					this._exprStack.push(curr);
					this._exprStack.push(Interpreter._copyExpr(curr.right));
				} else {
					this._replaceArgWithLiteral({
						left: curr.left.tree,
						right: curr.right.tree,
					})
				}
			} else if (curr.type === "identName") {
				//Look up the variable in the store, using nil as a fallback
				this._replaceArgWithLiteral(this._store.get(curr.value) || null);
			} else if (curr.type === "tree") {
				this._replaceArgWithLiteral(curr.tree);
			} else if (curr.type === "list") {
				let res: EXEC_AST_TREE|Literal = {
					type: 'literal',
					tree: null
				};
				for (let i = curr.elements.length; i >= 0; --i) {
					res = {
						type: 'tree_expr',
						left: curr.elements[i],
						right: res,
					}
				}
				if (res.type === 'literal') {
					this._exprStack.push({
						type: 'tree',
						tree: res.tree
					});
				} else {
					this._replaceArgWithLiteral(null);
				}
			} else if (curr.type === "macro") {
				//TODO: Macros
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
	private static _copyExpr(expr: AST_EXPR|EXEC_AST_EXPR): EXEC_AST_EXPR {
		let copy: EXEC_AST_EXPR = {...expr};
		if (copy.type === 'root' || copy.type === 'operation') {
			//Recreate the object's argument list to prevent overwriting the original when it's changed
			copy.args = [...copy.args]
		}
		return copy;
	}

	/**
	 * Replace the first non-literal argument of the expression at the top of {@link _exprStack} with a literal value.
	 * @param val	The literal value to assign in place of the argument
	 */
	private _replaceArgWithLiteral(val: BinaryTree) {
		//Read the parent expression from the stack
		let par: EXEC_AST_EXPR|undefined = this._exprStack.pop();

		//Wrap the value as a Literal
		let literal: Literal = {
			type: 'literal',
			tree: val
		};

		if (par === undefined) {
			throw new Error(`Can't assign argument to undefined object`);
		} else if (par.type === 'operation' || par.type === 'root') {
			for (let i = 0; i < par.args.length; i++) {
				//Find the first non-literal argument
				if (par.args[i].type !== 'literal') {
					//Replace it with the value argument
					par.args[i] = literal;
					//Stop after 1 replace
					break;
				}
			}
		} else if (par.type === 'tree_expr') {
			if (par.left.type !== 'literal') {
				par.left = literal;
			} else {
				par.right = literal;
			}
		} else if (par.type === 'equal') {
			if (par.arg1.type !== 'literal') {
				par.arg1 = literal;
			} else {
				par.arg2 = literal;
			}
		// } else if (par.type === 'macro') {
		// } else if (par.type === 'identifier') {
		} else {
			//Unknown/invalid expression type
			throw new Error(`Can't assign argument to type '${par!.type}'`);
		}

		//Add the parent expression back onto the stack
		this._exprStack.push(par);
	}
}
