import {
	IDENT_TYPE,
	TKN_ASSGN,
	TKN_BLOCK_CLS,
	TKN_BLOCK_OPN,
	TKN_ELSE,
	TKN_HD,
	TKN_IF,
	TKN_PREN_CLS,
	TKN_PREN_OPN,
	TKN_READ,
	TKN_SEP,
	TKN_TL,
	TKN_WHILE,
	TKN_WRITE,
	WHILE_TOKEN
} from "../../types/tokens";
import {
	AST_SWITCH_CASE_PARTIAL,
	AST_CMD,
	AST_CMD_PARTIAL,
	AST_SWITCH_DEFAULT_PARTIAL,
	AST_EXPR,
	AST_EXPR_PARTIAL,
	AST_PROG,
	AST_PROG_PARTIAL,
	AST_SWITCH_CASE,
	AST_SWITCH_DEFAULT,
	AST_SWITCH,
	AST_SWITCH_PARTIAL,
	AST_MACRO,
	AST_MACRO_PARTIAL,
	AST_EXPR_TREE,
	AST_EXPR_TREE_PARTIAL
} from "../../types/ast";
import Position, { incrementPos } from "../../types/position";
import { ErrorManager as BaseErrorManager, ErrorType } from "../../utils/errorManager";
import {
	TKN_CASE,
	TKN_COLON, TKN_COMMA,
	TKN_DEFAULT,
	TKN_DOT,
	TKN_EQL,
	TKN_LIST_CLS,
	TKN_LIST_OPN,
	TKN_MCRO_CLS,
	TKN_MCRO_OPN,
	TKN_SWITCH,
	WHILE_TOKEN_EXTD
} from "../../types/extendedTokens";
import { BinaryTree } from "../../types/Trees";

export interface ParserOpts {
	pureOnly?: boolean
}

interface IntParserOpts {
	pureOnly: boolean
}

/**
 * Internal representation for the result status of an operation.
 * Provides more information than a null/undefined result.
 */
enum ParseStatus {
	OK,
	ERROR,
	EOI,
}

class ErrorManager extends BaseErrorManager {
	constructor() {
		super();
	}

	public unexpectedToken(position: Position, actual?: string, ...expected: string[]): this {
		return this.unexpectedValue(position, 'token', actual, ...expected);
	}

	public unexpectedEOI(position: Position, ...expected: string[]): this {
		return this.unexpectedValue(position, 'end of input', undefined, ...expected);
	}

	public unexpectedValue(position: Position, type: string = 'token', actual?: string, ...expected: string[]): this {
		let msg = `Unexpected ${type}`;
		if (expected.length === 0) {
			if (actual) msg += `: "${actual}"`;
		} else {
			if (actual) msg += ` "${actual}"`;
			if (expected.length === 1) msg += `: Expected "${expected[0]}"`;
			else msg += `: Expected one of "${expected.join(`", "`)}"`;
		}
		return this.addError(position, msg);
	}
}

/**
 * Object containing state information for use in parsing.
 * Acts as a queue wrapper around the program token list.
 */
class StateManager {
	private readonly _errorManager: ErrorManager;
	private readonly _tokens: WHILE_TOKEN_EXTD[];
	private _pos: Position;
	private _lastToken: WHILE_TOKEN_EXTD|undefined;

	public constructor(tokens: WHILE_TOKEN_EXTD[]) {
		this._errorManager = new ErrorManager();
		this._tokens = tokens;
		this._lastToken = undefined;
		this._pos = {
			col: 0,
			row: 0,
		};
	}

	/**
	 * Object to manage the produced error messages
	 */
	public get errorManager(): ErrorManager {
		return this._errorManager;
	}

	/**
	 * All the error messages produced up to this point.
	 *
	 * Wrapper around {@link ErrorManager.errors}
	 */
	public get errors(): ErrorType[] {
		return this.errorManager.errors;
	}

	/**
	 * Pop a token from the start of the token list, and expect it to match one of the provided expected tokens..
	 * Automatically produces an error if the token is an unexpected value or if the token list ends prematurely.
	 * @param expected	List of the tokens to accept here.
	 * 					Empty for any token.
	 * @returns {[ParseStatus.OK, WHILE_TOKEN_EXTD]}	The next token value from the list, which is one of {@code expected}
	 * @returns {[ParseStatus.ERROR, WHILE_TOKEN_EXTD]}	The next token value from the list, which is not one of {@code expected}
	 * @returns {[ParseStatus.EOI, null]}	No return token as the list is empty
	 */
	public expect(...expected: string[]): [ParseStatus, WHILE_TOKEN_EXTD|null] {
		const first = this._next();
		//Unexpected end of token list
		if (first === null) {
			this.unexpectedEOI(...expected);
			return [ParseStatus.EOI, null];
		}

		//Allow any token if no expected was provided
		if (expected.length === 0) return [ParseStatus.OK, first];
		//The token matches the expected value
		for (let exp of expected) {
			if (first.value === exp) return [ParseStatus.OK, first];
		}

		//The token is unexpected - add an error
		this.unexpectedToken(first.value, ...expected);
		return [ParseStatus.ERROR, first];
	}

	/**
	 * Get the next token in the token list and remove from the queue.
	 */
	public next(): WHILE_TOKEN_EXTD|null {
		return this._next();
	}

	/**
	 * Get the next token in the token list without removing from the queue.
	 * @param pos	The position of the token to read from the list.
	 * 				Default {@code 0} (the first element).
	 * @return {WHILE_TOKEN_EXTD} 	The next token in the list
	 * @return {null} 				If the list is empty, or if the position is after the end of the list.
	 */
	public peek(pos = 0): WHILE_TOKEN_EXTD|null {
		if (pos < 0 || pos >= this._tokens.length) return null;
		return this._tokens[pos];
	}

	/**
	 * Read from the token list until one of the expected tokens (or the end of the list) is reached.
	 * The terminating token (EOI or one of {@code expected}) is not popped from the queue.
	 * @param expected	Tokens to look for to break the match
	 * @returns {WHILE_TOKEN_EXTD[]}	The tokens popped from the queue
	 */
	public consumeUntil(...expected: string[]) : WHILE_TOKEN_EXTD[] {
		let res: WHILE_TOKEN_EXTD[] = [];
		let next;
		while ((next = this.peek()) !== null) {
			for (let e of expected) {
				if (next.value === e) return res;
			}
			res.push(this.next() as WHILE_TOKEN_EXTD);
		}
		return res;
	}

	//TODO: Write `consumeUntilMatchingParen` which counts opening/closing brackets of different types.
	//	Should accept a starting bracket as param

	//Errors

	/**
	 * Add an error message at the current token
	 * @param msg	The error message
	 */
	public addError(msg: string): this {
		this._errorManager.addError(this._pos, msg);
		return this;
	}

	/**
	 * Add a generic "unexpected ??" message at the current token
	 * @param type		The type which was unexpected (e.g. 'token')
	 * @param actual	The unexpected value
	 * @param expected	The expected value(s)
	 * @example		{@code unexpectedValue('number', '10', '20)} -> {@code "Unexpected number: Expected 20 got 10"}
	 */
	public unexpectedValue(type: string|number, actual?: string|number, ...expected: string[]): this {
		if (typeof type === 'number') type = type.toString();
		if (typeof actual === 'number') actual = actual.toString();
		this._errorManager.unexpectedValue(this._pos, type, actual, ...expected);
		return this;
	}

	/**
	 * Add an unexpected token error at the current token
	 * @param actual	The received tokens
	 * @param expected	The expected token(s)
	 */
	public unexpectedToken(actual?: string|number, ...expected: string[]): this {
		if (typeof actual === 'number') actual = actual.toString();
		this._errorManager.unexpectedToken(this._pos, actual, ...expected);
		return this;
	}

	/**
	 * Add an unexpected end-of-input error at the current token
	 * @param expected	The expected token(s)
	 */
	public unexpectedEOI(...expected: string[]): this {
		this._errorManager.unexpectedEOI(this._pos, ...expected);
		return this;
	}

	public unexpectedEOICustom(msg: string) {
		this.errorManager.addError(this._pos, `Unexpected end of input: ${msg}`);
	}

	public unexpectedTokenCustom(actual: string|number|undefined, msg: string) {
		if (typeof actual === 'number') actual = actual.toString();
		if (actual) {
			this.errorManager.addError(this._pos, `Unexpected token "${actual}": ${msg}`);
		} else {
			this.errorManager.addError(this._pos, `Unexpected token: ${msg}`);
		}
	}

	//Internal util methods
	/**
	 * Pop and return the next token from the queue, and update the position counter.
	 * @returns {WHILE_TOKEN_EXTD}	The next token in the list
	 * @returns {null} 			If the token list is empty
	 */
	private _next(): WHILE_TOKEN_EXTD|null {
		//Read the next token in the list
		const first = this._tokens.shift() || null;
		//Increment the position counter
		if (first !== null) {
			this._pos = {...first.pos};
			this._lastToken = first;
		} else {
			if (this._lastToken === undefined) {
				incrementPos(this._pos, '');
			} else if (typeof this._lastToken.value === 'number') {
				incrementPos(
					this._pos,
					this._lastToken.value.toString()
				);
			} else {
				incrementPos(
					this._pos,
					this._lastToken.value
				);
			}
		}
		//Return the token
		return first;
	}
}

/**
 * Convert a number to it's binary tree representation
 * @param n		The number to convert
 */
function _numToTree(n: number): BinaryTree {
	//The created binary tree
	let tree: BinaryTree = null;
	//Subtract 1 from the number each iteration
	for (; n > 0; n--) {
		//Add one more layer to the top of the tree
		tree = {
			left: null,
			right: tree,
		}
	}
	//Return the created tree
	return tree;
}

/**
 * Check that a variable name doesn't overlap with any built-in constants.
 * @param name	The variable name
 * @param opts	Configuration options object
 * @returns true	If the name can be used for a variable name
 * @returns false	If the name overlaps with a constant
 */
function _isValidVariableName(name: string, opts: IntParserOpts): boolean {
	//Pure language constants
	if (name === 'true') return false;
	//Extended language constants
	if (!opts.pureOnly) {
		return name !== 'false'
			&& name !== 'true';
	}
	//Is valid
	return true;
}

// ================
// Parser functions
// ================

/**
 * Read an expression (hd/tl/cons) from the token list.
 * Returns a list containing the parser segment status, and the parsed expression tree.
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_EXPR]}			The parsed expression tree
 * @returns {[ParseStatus.ERROR, AST_EXPR|AST_EXPR_PARTIAL|null]}	The parsed expression with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_EXPR|AST_EXPR_PARTIAL|null]}		The parsed expression with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readExpr(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] {
	function _readExprInt(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] {
		let first = state.next();
		//Handle early end of input
		if (first === null) return [ParseStatus.EOI, null];

		let res: AST_EXPR|AST_EXPR_PARTIAL|null;

		//Support brackets around expressions
		if (first.value === TKN_PREN_OPN) {
			let status: ParseStatus = ParseStatus.OK;
			//Parse the expression between the brackets
			const [exprStatus, expr]: [ParseStatus, AST_EXPR | AST_EXPR_PARTIAL | null] = _readExpr(state, opts);
			if (exprStatus !== ParseStatus.OK) status = exprStatus;

			//Expect a closing parenthesis
			let close = state.next();
			if (close === null) {
				state.unexpectedEOI(TKN_PREN_CLS);
				status = ParseStatus.OK;
			} else if (close.value === TKN_PREN_CLS) {
				//Brackets match
			} else {
				state.unexpectedToken(close.value, TKN_PREN_CLS);
				status = ParseStatus.ERROR;
			}

			//Return the result of the expression
			return [status, expr];
		}

		if (first.type === 'operation') {
			//Parse `hd` and `tl`
			if (first.value === TKN_HD || first.value === TKN_TL) {
				const [exprState, arg]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
				if (arg === null) {
					return [exprState, {
						type: 'operation',
						complete: false,
						op: first,
						args: [arg]
					}];
				} else if (arg.type === 'identifier' || arg.complete) {
					//The argument is an identifier or complete operation
					return [exprState, {
						type: 'operation',
						complete: true,
						op: first,
						args: [arg]
					}];
				} else {
					//The argument is an incomplete operation
					return [exprState, {
						type: 'operation',
						complete: false,
						op: first,
						args: [arg]
					}];
				}
			}

			//Parse `cons`
			const [leftStatus, left]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
			const [rightStatus, right]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);

			let status: ParseStatus = ParseStatus.OK;
			if (leftStatus !== ParseStatus.OK) status = leftStatus;
			if (rightStatus !== ParseStatus.OK) status = rightStatus;

			if (!left || !right
				|| (left.type !== 'identifier' && !left.complete)
				|| (right.type !== 'identifier' && !right.complete)
			) {
				return [status, {
					type: 'operation',
					complete: false,
					op: first,
					args: [
						left,
						right
					]
				}];
			} else {
				return [status, {
					type: 'operation',
					complete: true,
					op: first,
					args: [
						left,
						right
					]
				}];
			}
		} else if (first.type === 'identifier') {
			return [ParseStatus.OK, first];
		} else {
			if (!opts.pureOnly) {
				if (first.type === 'number') {
					return [ParseStatus.OK, {
						type: 'tree',
						complete: true,
						tree: _numToTree(first.value)
					}];
				} else if (first.value === TKN_LIST_OPN) {
					let [lstStatus, lstBody]: [ParseStatus, (AST_EXPR|AST_EXPR_PARTIAL|null)[]] = _readListBody(state, opts);
					if (lstStatus === ParseStatus.OK) {
						return [lstStatus, {
							type: 'list',
							complete: true,
							elements: lstBody as AST_EXPR[],
						}];
					}
					return [lstStatus, {
						type: 'list',
						complete: false,
						elements: lstBody,
					}];
				} else if (first.value === TKN_MCRO_OPN) {
					return _readTreeOrMacro(state, opts);
				}
			}
			state.unexpectedTokenCustom(first.value, 'Expected an expression or an identifier');
			return [ParseStatus.ERROR, {
				type: 'operation',
				complete: false,
				op: null,
				args: []
			}];
		}
	}

	let [resStat, res]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExprInt(state, opts);

	//Check if this expression is an equality check
	if (!opts.pureOnly && state.peek()?.value === TKN_EQL) {
		state.next();

		let [nextStatus, next]: [ParseStatus, (AST_EXPR|AST_EXPR_PARTIAL|null)] = _readExpr(state, opts);

		if (nextStatus === ParseStatus.OK) {
			return [ParseStatus.OK, {
				type: 'equal',
				complete: true,
				arg1: res as AST_EXPR,
				arg2: next as AST_EXPR,
			}];
		}
		return [nextStatus, {
			type: 'equal',
			complete: false,
			arg1: res,
			arg2: next,
		}];
	}

	return [resStat, res];
}

/**
 * Read the content of a list statement from the program token list.
 * Assumes that the {@code TKN_LIST_OPN} token HAS been read from the token list.
 * Returns a list containing each element of the list, in order
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_SWITCH]}			The parsed element list
 * @returns {[ParseStatus.ERROR, (AST_EXPR|AST_EXPR_PARTIAL|null)[]]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, (AST_EXPR|AST_EXPR_PARTIAL|null)[]]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readListBody(state: StateManager, opts: IntParserOpts): [ParseStatus, (AST_EXPR|AST_EXPR_PARTIAL|null)[]] {
	//Exit here if the list ends immediately
	let next: WHILE_TOKEN_EXTD|null = state.peek();
	if (next === null) {
		//Move the pointer to after the last token
		state.next();
		state.unexpectedEOI(TKN_LIST_CLS);
		return [ParseStatus.EOI, []];
	} else if (next.value === TKN_LIST_CLS) {
		//Consume the separator
		state.next();
		return [ParseStatus.OK, []];
	}

	let res: (AST_EXPR|AST_EXPR_PARTIAL|null)[] = [];
	let status: ParseStatus = ParseStatus.OK;
	while (true) {
		const [statementStatus, statement]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		res.push(statement);

		if (statementStatus === ParseStatus.EOI) {
			//On end of input
			status = statementStatus;
			break;
		} else if (statementStatus === ParseStatus.ERROR) {
			//On parsing error, consume the input until a separator token is reached
			//Then start afresh
			state.consumeUntil(TKN_LIST_CLS, TKN_COMMA);
			status = ParseStatus.ERROR;
		}

		//Check that the next token is a comma or closing bracket
		let next: WHILE_TOKEN_EXTD|null = state.peek();
		if (next === null) {
			status = ParseStatus.EOI;
			//Move the pointer to after the last token
			state.next();
			state.unexpectedEOI(TKN_COMMA, TKN_LIST_CLS);
			break;
		} else if (next.value === TKN_COMMA) {
			//Consume the separator to start clean next loop
			state.next();
			//Move on to the next statement
			continue;
		} else if (next.value === TKN_LIST_CLS) {
			state.next();
			break;
		}
		//Unknown token - consume the input until the next known position
		state.consumeUntil(TKN_COMMA, TKN_LIST_CLS);
	}

	return [status, res];
}

/**
 * Read a tree statement from the program token list.
 * Assumes that the {@code TKN_TREE_OPN} token HAS been read from the token list.
 * Returns a list containing the parser segment status, and the parsed command tree
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_EXPR_TREE]}			The parsed switch statement
 * @returns {[ParseStatus.ERROR, AST_EXPR_TREE_PARTIAL]}	The parsed statement with {@code null} where information can't be parsed
 * @returns {[ParseStatus.EOI, AST_EXPR_TREE_PARTIAL]}	The parsed statement with {@code null} where information can't be parsed
 */
function _readTreeBody(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_EXPR_TREE|AST_EXPR_TREE_PARTIAL] {
	let status: ParseStatus = ParseStatus.OK;

	//Read the left-hand node
	const [leftStatus, left]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
	if (leftStatus === ParseStatus.EOI) {
		return [ParseStatus.EOI, {
			type: 'tree_expr',
			complete: false,
			left: left,
			right: null,
		}];
	}
	if (leftStatus !== ParseStatus.OK) status = leftStatus;

	//Check that the next token is a dot separating the elements
	let [dotStatus,]: [ParseStatus, unknown] = state.expect(TKN_DOT);
	if (dotStatus === ParseStatus.EOI) {
		return [ParseStatus.EOI, {
			type: 'tree_expr',
			complete: false,
			left: left,
			right: null,
		}];
	}
	if (dotStatus !== ParseStatus.OK) status = dotStatus;

	//Read the right-hand node
	const [rightStatus, right]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
	if (rightStatus === ParseStatus.EOI) {
		return [ParseStatus.EOI, {
			type: 'tree_expr',
			complete: false,
			left: left,
			right: right,
		}];
	}
	if (rightStatus !== ParseStatus.OK) status = rightStatus;

	//Read the closing tree bracket
	let [clsStatus,]: [ParseStatus, unknown] = state.expect(TKN_MCRO_CLS);
	if (clsStatus !== ParseStatus.OK) status = clsStatus;

	//Return the tree
	if (status === ParseStatus.OK) {
		return [status, {
			type: 'tree_expr',
			complete: true,
			left: left as AST_EXPR,
			right: right as AST_EXPR,
		}];
	}
	return [status, {
		type: 'tree_expr',
		complete: false,
		left: left,
		right: right,
	}];
}

/**
 * Read either a tree statement or a macro call from the program token list.
 * Assumes that the {@code TKN_TREE_OPN} token HAS been read from the token list.
 * Returns a list containing the parser segment status, and the produced AST
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_EXPR_TREE]}			The parsed switch statement
 * @returns {[ParseStatus.ERROR, AST_EXPR_TREE_PARTIAL]}	The parsed statement with {@code null} where information can't be parsed
 * @returns {[ParseStatus.EOI, AST_EXPR_TREE_PARTIAL]}	The parsed statement with {@code null} where information can't be parsed
 */
function _readTreeOrMacro(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL]{
	//If the token list starts with `identifier>` then assume it is a macro call
	if (state.peek()?.type === 'identifier' && state.peek(1)?.value === TKN_MCRO_CLS) {
		let status: ParseStatus = ParseStatus.OK;

		//The program name
		let progName: string = (state.next() as IDENT_TYPE).value;

		//Check that the next token is a dot separating the elements
		let [clsStatus,]: [ParseStatus, unknown] = state.expect(TKN_MCRO_CLS);
		if (clsStatus === ParseStatus.EOI) {
			return [ParseStatus.EOI, {
				type: 'macro',
				complete: false,
				input: null,
				program: progName,
			}];
		}
		if (clsStatus !== ParseStatus.OK) status = clsStatus;

		//Read the input expression
		const [inpStatus, inp]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		if (inpStatus === ParseStatus.EOI) {
			return [ParseStatus.EOI, {
				type: 'macro',
				complete: false,
				program: progName,
				input: inp,
			}];
		}
		if (inpStatus !== ParseStatus.OK) status = inpStatus;

		//Return the macro call node
		if (status === ParseStatus.OK) {
			return [status, {
				type: 'macro',
				complete: true,
				program: progName,
				input: inp as AST_MACRO,
			}];
		}
		return [status, {
			type: 'macro',
			complete: false,
			program: progName,
			input: inp as AST_MACRO|AST_MACRO_PARTIAL,
		}];
	}
	//Otherwise assume the token list is representing a tree
	return _readTreeBody(state, opts);
}

/**
 * Read the contents of an else block from the token list.
 * Returns a list containing the parser segment status, and list of parsed command trees
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, (AST_CMD)[]]}			List of each statement in the else block
 * @returns {[ParseStatus.ERROR, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement in the else block, if readable, {@code null} where not possible
 * @returns {[ParseStatus.EOI, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement in the else block, if readable, {@code null} where not possible
 */
function _readElse(state: StateManager, opts: IntParserOpts): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
	let peek = state.peek();
	if (peek === null) {
		//Unexpected end of input
		state.unexpectedEOI(TKN_BLOCK_CLS);
		return [ParseStatus.EOI, []];
	} else if (peek.value === TKN_ELSE) {
		//An else statement was provided
		state.next();
		return _readBlock(state, opts);
	} else {
		//Assume there wasn't meant to be an else statement
		//I.e. treat it the same as `else {}`
		return [ParseStatus.OK, []];
	}
}

/**
 * Read a list of statements (separated by semicolons) from the program token list.
 * Assumes that the first token has NOT been read from the token list.
 * Returns a list containing the parser segment status, and a list of the parsed statements
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_CMD[]]}			The parsed statement list
 * @returns {[ParseStatus.ERROR, (AST_CMD_PARTIAL|null)[]]}	The parsed statement list with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, (AST_CMD_PARTIAL|null)[]]}	The parsed statement list with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readStatementList(state: StateManager, opts: IntParserOpts): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
	let res: (AST_CMD|AST_CMD_PARTIAL|null)[] = [];
	let status: ParseStatus = ParseStatus.OK;
	while (true) {
		const [statementStatus, statement]: [ParseStatus, AST_CMD|AST_CMD_PARTIAL|null] = _readStmt(state, opts);
		res.push(statement);

		if (statementStatus === ParseStatus.EOI) {
			//On end of input
			status = statementStatus;
			break;
		} else if (statementStatus === ParseStatus.ERROR) {
			//On parsing error, consume the input until a separator token is reached
			//Then start afresh
			state.consumeUntil(TKN_BLOCK_CLS, TKN_SEP);
			status = ParseStatus.ERROR;
		}

		//Check that the next token is a statement separator or
		let next: WHILE_TOKEN_EXTD|null = state.peek();
		if (next === null) {
			status = ParseStatus.EOI;
			//Move the pointer to after the last token
			state.next();
			state.unexpectedEOI(TKN_SEP, TKN_BLOCK_CLS);
			break;
		} else if (next.value === TKN_SEP) {
			//Consume the separator to start clean next loop
			state.next();
			//Move on to the next statement
			continue;
		}
		break;
	}

	return [status, res];
}

/**
 * Read a switch's {@code case}/{@code default} statement from the program token list.
 * Assumes that the {@code TKN_CASE}/{@code TKN_DEFAULT} token has NOT been read from the token list.
 * Returns a list containing the parser segment status, and the parsed command tree
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_SWITCH_CASE|AST_SWITCH_DEFAULT]}			The parsed case statement
 * @returns {[ParseStatus.ERROR, AST_SWITCH_CASE_PARTIAL|AST_SWITCH_DEFAULT_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_SWITCH_CASE_PARTIAL|AST_SWITCH_DEFAULT_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readCase(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_SWITCH_CASE|AST_SWITCH_CASE_PARTIAL|AST_SWITCH_DEFAULT|AST_SWITCH_DEFAULT_PARTIAL|null] {
	/**
	 * Internal function to read the common parts of case/default statements.
	 * i.e. the ': <body>' parts.
	 *
	 * Returns a list containing the parser segment status, and the parsed command tree
	 * @param state		The parser state manager object
	 * @returns {[ParseStatus.OK, AST_CMD[]]}			The parsed case statement body
	 * @returns {[ParseStatus.ERROR, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	The parsed body with {@code null} where information can't be parsed
	 * @returns {[ParseStatus.EOI, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	The parsed body with {@code null} where information can't be parsed
	 */
	function _readCaseBody(state: StateManager): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
		//Expect a colon after the case definition
		let [colonStat,]: [ParseStatus,unknown] = state.expect(TKN_COLON);
		if (colonStat !== ParseStatus.OK) status = colonStat;

		//Parse the case body
		let body: (AST_CMD | AST_CMD_PARTIAL | null)[];
		if (colonStat === ParseStatus.EOI) {
			status = ParseStatus.EOI;
			body = [];
		} else if (state.peek()?.value === TKN_CASE || state.peek()?.value === TKN_DEFAULT || state.peek()?.value === TKN_BLOCK_CLS) {
			status = ParseStatus.ERROR;
			body = [];
			state.addError(`Switch cases may not have empty bodies`);
		} else {
			let bodyStatus: ParseStatus
			[bodyStatus, body] = _readStatementList(state, opts);
			if (bodyStatus !== ParseStatus.OK) status = bodyStatus;
		}
		return [status, body];
	}

	//Read the case/default token from the list
	let caseTkn: WHILE_TOKEN_EXTD|null = state.next();
	if (caseTkn === null) return [ParseStatus.EOI, null];

	//Hold the parsing status for this case
	let status: ParseStatus;

	if (caseTkn.value === TKN_DEFAULT) {
		//The statement is a "default" case
		status = ParseStatus.OK;

		//Read the body of the case statement
		let [caseStatus, body] = _readCaseBody(state);
		if (caseStatus !== ParseStatus.OK) status = caseStatus;

		if (status === ParseStatus.OK) {
			//The statement was all parsed correctly
			return [status, {
				type: 'switch_default',
				complete: true,
				body: body as AST_CMD[]
			}];
		}
		//The statement was parsed with issues
		return [status, {
			type: 'switch_default',
			complete: false,
			body: body
		}];
	} else if (caseTkn.value === TKN_CASE) {
		//Read the case's expression
		let [exprStatus, expr]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		if (exprStatus === ParseStatus.EOI) return [ParseStatus.EOI, {type: 'switch_case', complete: false, body: [], cond: expr}];

		//Check the expression was parsed correctly
		status = exprStatus;
		if (expr === null || expr.type !== 'identifier' && expr.type !== 'tree' && !expr.complete) {
			status = ParseStatus.ERROR;
		}

		//Read the body of the case statement
		let [caseStatus, body]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readCaseBody(state);
		if (caseStatus !== ParseStatus.OK) status = caseStatus;

		if (status === ParseStatus.OK) {
			//The statement was all parsed correctly
			return [status, {
				type: 'switch_case',
				complete: true,
				cond: expr as AST_EXPR,
				body: body as AST_CMD[]
			}];
		}
		//The statement was parsed with issues
		return [status, {
			type: 'switch_case',
			complete: false,
			cond: expr,
			body: body
		}];
	} else{
		//Unknown case
		state.unexpectedToken(caseTkn.value, TKN_CASE, TKN_DEFAULT);
		return [ParseStatus.ERROR, null];
	}
}

/**
 * Read a switch statement from the program token list.
 * Assumes that the {@code TKN_SWITCH} token HAS been read from the token list.
 * Returns a list containing the parser segment status, and the parsed command tree
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_SWITCH]}			The parsed switch statement
 * @returns {[ParseStatus.ERROR, AST_SWITCH_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_SWITCH_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readSwitch(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_SWITCH|AST_SWITCH_PARTIAL|null] {
	let status: ParseStatus = ParseStatus.OK;
	//Expression passed as input to  the switch
	let [inpStatus,inpExpr]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
	if (inpStatus === ParseStatus.EOI) return [ParseStatus.EOI, null];
	if (inpStatus !== ParseStatus.OK) status = inpStatus;

	//Build up the switch cases and default value
	let cases: (AST_SWITCH_CASE|AST_SWITCH_CASE_PARTIAL|null)[] = [];
	let dflt: AST_SWITCH_DEFAULT|AST_SWITCH_DEFAULT_PARTIAL|null = null;

	//Expect a "{" to open the switch
	let [opnStatus,]: [ParseStatus, unknown] = state.expect(TKN_BLOCK_OPN);
	if (opnStatus === ParseStatus.EOI) return [ParseStatus.EOI, null];
	if (opnStatus !== ParseStatus.OK) status = opnStatus;

	//Read all the cases
	let next: WHILE_TOKEN_EXTD|null;
	while ((next = state.peek()) !== null) {
		if (next.value !== TKN_DEFAULT && next.value !== TKN_CASE) break;

		//The default case should be the last in the switch
		if (dflt !== null) {
			status = ParseStatus.ERROR;
			state.errorManager.addError(
				next.pos,
				`The 'default' case should be the last case in the block`
			)
		}

		//Read the next case statement and body from the token list
		let caseStatus: ParseStatus;
		let body: AST_SWITCH_CASE|AST_SWITCH_CASE_PARTIAL|AST_SWITCH_DEFAULT|AST_SWITCH_DEFAULT_PARTIAL|null;
		[caseStatus, body] = _readCase(state, opts);
		//Update the status if the case wasn't parsed completely
		if (caseStatus !== ParseStatus.OK) status = caseStatus;

		if (status === ParseStatus.EOI) {
			//Unexpected end of input
			break;
		} else if (body === null) {
			cases.push(body);
		} else if (body.type === 'switch_case') {
			//A case statement
			cases.push(body);
		} else {
			//A default statement
			dflt = body;
		}
	}

	//Create an empty default case if one wasn't provided
	if (dflt === null) {
		dflt = {
			type: 'switch_default',
			complete: true,
			body: []
		};
	}

	//Expect a closing block symbol
	let [s,] = state.expect(TKN_BLOCK_CLS);
	if (s !== ParseStatus.OK) status = s;

	if (status === ParseStatus.OK) {
		//If the switch was parsed without issue, return a completed switch AST node
		return [
			status,
			{
				type: 'switch',
				complete: true,
				condition: inpExpr as AST_EXPR,
				cases: cases as AST_SWITCH_CASE[],
				default: dflt as AST_SWITCH_DEFAULT,
			}
		];
	}
	//Otherwise return a partial AST node
	return [
		status,
		{
			type: 'switch',
			complete: false,
			condition: inpExpr,
			cases: cases,
			default: dflt,
		}
	];
}

/**
 * Read a statement (if/if-else/while/assignment) from the program token list.
 * Returns a list containing the parser segment status, and the parsed command tree
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_CMD]}			The parsed statement
 * @returns {[ParseStatus.ERROR, AST_CMD_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_CMD_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readStmt(state: StateManager, opts: IntParserOpts): [ParseStatus, AST_CMD|AST_CMD_PARTIAL|null] {
	let first = state.next();
	//Handle early end of input
	if (first === null) {
		return [ParseStatus.EOI, null];
	}

	if (first.value === TKN_IF) {
		//First attempt to read the condition expression
		let [condStatus, cond]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		//Then read the conditional body
		let [ifState, ifBlock]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readBlock(state, opts);
		//And the 'else' body
		let [elseState, elseBlock]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readElse(state, opts);
		//Return success if all the segments were parsed correctly
		if (cond !== null && (cond.type === 'identifier' || cond.type === 'tree' || cond.complete) && condStatus === ParseStatus.OK && ifState === ParseStatus.OK && elseState === ParseStatus.OK) {
			//Return the produced AST node
			return [
				ParseStatus.OK,
				{
					type: 'cond',
					complete: true,
					condition: cond as AST_EXPR,
					if: ifBlock as AST_CMD[],
					else: elseBlock as AST_CMD[],
				}
			];
		}
		return [
			ParseStatus.ERROR,
			{
				type: 'cond',
				complete: false,
				condition: cond,
				if: ifBlock,
				else: elseBlock,
			}
		];
	} else if (first.value === TKN_WHILE) {
		let status: ParseStatus = ParseStatus.OK;

		let [condStatus, cond]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		if (condStatus !== ParseStatus.OK) status = condStatus;
		if (condStatus === ParseStatus.EOI) return [ParseStatus.EOI, null];

		let [bodyState, body]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readBlock(state, opts);
		if (bodyState !== ParseStatus.OK) status = bodyState;

		if (status === ParseStatus.OK) {
			return [
				ParseStatus.OK,
				{
					type: 'loop',
					complete: true,
					condition: cond as AST_EXPR,
					body: body as AST_CMD[],
				}
			];
		} else {
			return [
				status,
				{
					type: 'loop',
					complete: false,
					condition: cond,
					body: body,
				}
			];
		}
	} else if (first.type === 'identifier') {
		let status: ParseStatus = ParseStatus.OK;
		//The expression is an assignment statement
		//Check that the variable name doesn't overlap with a constant
		let isVarValid: boolean = _isValidVariableName(first.value, opts);
		if (!isVarValid) state.addError(`Not a valid variable name`);

		//Expect ":="
		let [assgnStatus,]: [ParseStatus,unknown] = state.expect(TKN_ASSGN);
		if (assgnStatus === ParseStatus.EOI) return [ParseStatus.EOI, null];
		if (assgnStatus !== ParseStatus.OK) status = assgnStatus;

		//Read the expression to assign
		const [valStatus, val]: [ParseStatus, AST_EXPR|AST_EXPR_PARTIAL|null] = _readExpr(state, opts);
		if (valStatus === ParseStatus.EOI) return [ParseStatus.EOI, null];
		if (valStatus !== ParseStatus.OK) status = valStatus;

		if (isVarValid && status === ParseStatus.OK && val !== null && (val.type === 'identifier' || val.complete)) {
			return [
				ParseStatus.OK,
				{
					type: 'assign',
					complete: true,
					ident: first,
					arg: val
				}
			];
		}
		return [
			ParseStatus.ERROR,
			{
				type: 'assign',
				complete: false,
				ident: first,
				arg: val
			}
		];
	} else if (!opts.pureOnly) {
		//The statement is a switch
		if (first.value === TKN_SWITCH) {
			return _readSwitch(state, opts);
		}
	}
	state.unexpectedTokenCustom(undefined, `Expected ${TKN_IF} ${TKN_WHILE} or an assignment statement`);
	return [ParseStatus.ERROR, null];
}

/**
 * Read a block of statements from the token list.
 * Returns a list containing the parser segment status, and the list of the parsed command trees.
 * See also: {@link _readStmt}
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, AST_CMD[]]}			List of each statement in the block
 * @returns {[ParseStatus.ERROR, (AST_CMD_PARTIAL|null)[]]}	List of each statement, if readable, {@code null} where not possible
 * @returns {[ParseStatus.EOI, (AST_CMD_PARTIAL|null)[]]}	List of each statement, if readable, {@code null} where not possible
 */
function _readBlock(state: StateManager, opts: IntParserOpts): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
	state.expect(TKN_BLOCK_OPN);

	const first: WHILE_TOKEN_EXTD|null = state.peek();
	if (first === null) {
		state.next();
		state.unexpectedEOI(TKN_BLOCK_CLS);
		return [ParseStatus.EOI, []];
	}

	if (first.value === TKN_BLOCK_CLS) {
		//Empty loop body
		state.next();
		return [ParseStatus.OK, []];
	}

	//Read a list of statements for the block body
	let [status, res]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readStatementList(state, opts);
	if (status === ParseStatus.EOI) return [status, res];

	//Expect a closing bracket
	let [clsStat,]: [ParseStatus, WHILE_TOKEN_EXTD|null] = state.expect(TKN_BLOCK_CLS);
	if (clsStat === ParseStatus.EOI) return [clsStat, res];

	//Return the produced AST
	if (status === ParseStatus.OK && clsStat === ParseStatus.OK)
		return [ParseStatus.OK, res];
	return [ParseStatus.ERROR, res];
}

/**
 * Read the "<name> read <input>" from the start of the token list.
 * Returns a list containing the parser segment status, the program name, and the input variable.
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, IDENT_TYPE, IDENT_TYPE]}			The program name, and input variable
 * @returns {[ParseStatus.ERROR, IDENT_TYPE|null, IDENT_TYPE|null]}	The program name and input variable if readable, {@code null} for each otherwise
 * @returns {[ParseStatus.EOI, IDENT_TYPE|null, IDENT_TYPE|null]}	The program name and input variable if readable, {@code null} for each otherwise
 */
function _readProgramIntro(state: StateManager, opts: IntParserOpts): [ParseStatus, IDENT_TYPE|null, IDENT_TYPE|null] {
	function _readInput(state: StateManager, opts: IntParserOpts): [ParseStatus, IDENT_TYPE|null] {
		const input: WHILE_TOKEN_EXTD|null = state.peek();
		if (input === null) {
			state.next();
			state.unexpectedEOICustom(`Missing input variable`);
			return [ParseStatus.EOI, null];
		} else if (input.value === TKN_BLOCK_OPN) {
			state.errorManager.addError(input.pos, `Unexpected token "${input.value}": Missing input variable`);
			return [ParseStatus.ERROR, null];
		} else if (input.type === 'identifier') {
			if (!_isValidVariableName(input.value, opts)) {
				//Invalid variable name
				state.addError(`Not a valid variable name`);
				state.next();
				return [ParseStatus.ERROR, input];
			}
			//Acceptable token
			state.next();
			return [ParseStatus.OK, input];
		} else {
			state.next();
			//Not an identifier
			state.unexpectedValue('type', input.type, 'identifier');
			return [ParseStatus.ERROR, null];
		}
	}

	function _readRead(state: StateManager, opts: IntParserOpts): [ParseStatus, IDENT_TYPE|null] {
		//"read"
		const read: WHILE_TOKEN_EXTD|null = state.peek();
		if (read === null) {
			state.next();
			state.unexpectedEOI(TKN_READ);
			return [ParseStatus.EOI, null];
		} else if (read.value === TKN_READ) {
			state.next();
			//Expected
			return _readInput(state, opts);
		} else if (read.value === TKN_BLOCK_OPN) {
			//The program opens directly onto the block
			state.errorManager.unexpectedToken(read.pos, undefined, TKN_READ);
			return [ParseStatus.ERROR, null];
		} else {
			state.next();
			state.unexpectedToken(read.value, TKN_READ);
			return [
				ParseStatus.ERROR,
				(read.type === 'identifier') ? read : null
			];
		}
	}

	//Program name
	let name: WHILE_TOKEN_EXTD|null = state.peek();
	if (name === null) {
		state.next();
		state.unexpectedEOICustom(`Missing program name`);
		return [ParseStatus.EOI, null, null];
	} else if (name.value === TKN_READ) {
		state.next();
		//The program name was missed
		state.errorManager.addError(name.pos, 'Unexpected token: Missing program name');
		let [inputStatus, input] = _readInput(state, opts);
		if (inputStatus === ParseStatus.OK) {
			return [ParseStatus.OK, null, input];
		} else {
			return [ParseStatus.ERROR, null, input];
		}
	} else if (name.value === TKN_BLOCK_OPN) {
		//The program opens directly onto the block
		state.errorManager.addError(name.pos, 'Unexpected token: Missing program name');
		state.errorManager.unexpectedToken(name.pos, undefined, TKN_READ);
		return [ParseStatus.ERROR, null, null];
	} else {
		state.next();
		let [inputStatus, inputVar]: [ParseStatus, IDENT_TYPE|null] = _readRead(state, opts);
		//A program name wasn't provided
		if (name.type !== 'identifier') {
			state.unexpectedValue('type', name.type, 'identifier');
			return [ParseStatus.ERROR, null, inputVar];
		}
		if (inputStatus === ParseStatus.OK) {
			//Acceptable token
			return [ParseStatus.OK, name as IDENT_TYPE, inputVar];
		}
		return [inputStatus, name as IDENT_TYPE, inputVar];
	}
}

/**
 * Read "write <output>" from the start of the token list.
 * Returns a list containing the parser segment status, and the output variable.
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns {[ParseStatus.OK, IDENT_TYPE]}			The output variable
 * @returns {[ParseStatus.ERROR, IDENT_TYPE|null]}	The output variable, if readable, {@code null} otherwise
 * @returns {[ParseStatus.EOI, IDENT_TYPE|null]}	The output variable, if readable, {@code null} otherwise
 */
function _readProgramOutro(state: StateManager, opts: IntParserOpts): [ParseStatus, IDENT_TYPE|null] {
	let err: ParseStatus = ParseStatus.OK;
	let output: IDENT_TYPE|null = null;

	//read the "write" token
	let write: WHILE_TOKEN_EXTD|null = state.next();
	if (write === null) {
		//Unexpected end of input
		state.unexpectedEOI(TKN_WRITE);
		return [ParseStatus.EOI, null];
	} else if (write.value === TKN_WRITE) {
		//Expected value
	} else if (write.type === 'identifier') {
		//Assume the "write" token was missed and the output variable was written directly
		state.unexpectedToken(write.value, TKN_WRITE);
		err = ParseStatus.ERROR;
		output = write;
	} else {
		//Unknown token
		state.unexpectedValue(write.type, write.value, TKN_WRITE);
		err = ParseStatus.ERROR;
	}

	//Output variable
	let outputVar: WHILE_TOKEN_EXTD|null = state.next();
	if (outputVar === null) {
		state.unexpectedEOI('identifier');
		err = ParseStatus.EOI;
	} else if (outputVar.type === 'identifier') {
		output = outputVar;
	} else {
		state.unexpectedTokenCustom(outputVar.value, ` Expected an identifier`);
		err = ParseStatus.ERROR;
	}

	//Check the variable name is valid
	if (output !== null && !_isValidVariableName(output.value, opts)) {
		state.addError(`Not a valid variable name`);
	}

	return [err, output];
}

/**
 * Read the root structure of a program from the token list
 * This is the {@code <prog> read <in> { ... } write <out>}
 * @param state		The parser state manager object
 * @param opts		Configuration options object
 * @returns AST_PROG			When a program was parsed without issue
 * @returns AST_PROG_PARTIAL	When at least one error was encountered with the program
 */
function _readProgram(state: StateManager, opts: IntParserOpts): AST_PROG | AST_PROG_PARTIAL {
	let bodyStatus: ParseStatus = ParseStatus.OK;
	let outputStatus: ParseStatus = ParseStatus.OK;
	let body: (AST_CMD|AST_CMD_PARTIAL|null)[] = [];
	let output: IDENT_TYPE|null = null;

	//Attempt to read the start of the program ("<name> read <in>")
	//Separate into the program name and input variable name
	let [progInStatus, name, input]: [ParseStatus, IDENT_TYPE|null, IDENT_TYPE|null] = _readProgramIntro(state, opts);

	//Don't attempt to parse the program if the input has already ended
	if (progInStatus !== ParseStatus.EOI) {
		//Read the program body
		[bodyStatus, body] = _readBlock(state, opts);
		if (bodyStatus !== ParseStatus.EOI) {
			//Read the outro of the program ("write <out>")
			[outputStatus, output] = _readProgramOutro(state, opts);
			//Expect that the token list ends here
			const final = state.next();
			if (final !== null) {
				state.unexpectedTokenCustom(final.value, 'Expected end of input');
			}
		}
	}

	//Mark the produced AST as complete if all the subtrees are valid
	if (name && input && output && (bodyStatus === ParseStatus.OK) && (progInStatus === ParseStatus.OK) && (outputStatus === ParseStatus.OK)) {
		//Return the produced program
		return {
			type: 'program',
			complete: true,
			input,
			output,
			name,
			body: body as AST_CMD[],
		}
	}
	//Otherwise mark it as incomplete
	return {
		type: 'program',
		complete: false,
		input,
		output,
		name,
		body,
	}
}

/**
 * Parse a token list (from the lexer) to an abstract syntax tree.
 * @param tokens	The program tokens to parse
 * @param props		Configuration options for the parser
 * @return	An abstract syntax tree representing the program, and a list of all the errors in the program
 */
export default function parser(tokens: WHILE_TOKEN[]|WHILE_TOKEN_EXTD[], props?: ParserOpts) : [AST_PROG|AST_PROG_PARTIAL, ErrorType[]] {
	props = props || {};
	let opts: IntParserOpts = {
		pureOnly: props.pureOnly || false,
	};

	//Make a state manager object for use in the parser
	const stateManager = new StateManager(tokens);
	//Parse the program
	const prog: AST_PROG|AST_PROG_PARTIAL = _readProgram(stateManager, opts);
	//Return the program and any discovered errors
	return [prog, stateManager.errors];
}
