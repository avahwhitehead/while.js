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
import { AST_CMD, AST_CMD_PARTIAL, AST_EXPR, AST_EXPR_PARTIAL, AST_PROG, AST_PROG_PARTIAL } from "../../types/ast";
import Position, { incrementPos } from "../../types/position";
import {
	ErrorManager as BaseErrorManager, ErrorType
} from "../../utils/errorManager";

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
	private readonly _tokens: WHILE_TOKEN[];
	private _pos: Position;
	private _lastToken: WHILE_TOKEN|undefined;

	public constructor(tokens: WHILE_TOKEN[]) {
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
	 * @returns {[ParseStatus.OK, WHILE_TOKEN]}	The next token value from the list, which is one of {@code expected}
	 * @returns {[ParseStatus.ERROR, WHILE_TOKEN]}	The next token value from the list, which is not one of {@code expected}
	 * @returns {[ParseStatus.EOI, null]}	No return token as the list is empty
	 */
	public expect(...expected: string[]): [ParseStatus, WHILE_TOKEN|null] {
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
	public next(): WHILE_TOKEN|null {
		return this._next();
	}

	/**
	 * Get the next token in the token list without removing from the queue.
	 * @return {WHILE_TOKEN} 	The next token in the list
	 * @return {null} 			If the list is empty.
	 */
	public peek(): WHILE_TOKEN|null {
		if (this._tokens.length === 0) return null;
		return this._tokens[0];
	}

	/**
	 * Read from the token list until one of the expected tokens (or the end of the list) is reached.
	 * The terminating token (EOI or one of {@code expected}) is not popped from the queue.
	 * @param expected	Tokens to look for to break the match
	 */
	public consumeUntil(...expected: string[]) : WHILE_TOKEN[] {
		let res = [];
		let next;
		while ((next = this.next()) !== null) {
			for (let e of expected) {
				if (next.value === e) return res;
			}
			res.push(next);
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
	public unexpectedValue(type: string, actual?: string, ...expected: string[]): this {
		this._errorManager.unexpectedValue(this._pos, type, actual, ...expected);
		return this;
	}

	/**
	 * Add an unexpected token error at the current token
	 * @param actual	The received tokens
	 * @param expected	The expected token(s)
	 */
	public unexpectedToken(actual?: string, ...expected: string[]): this {
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

	public unexpectedTokenCustom(actual: string|undefined, msg: string) {
		if (actual) {
			this.errorManager.addError(this._pos, `Unexpected token "${actual}": ${msg}`);
		} else {
			this.errorManager.addError(this._pos, `Unexpected token: ${msg}`);
		}
	}

	//Internal util methods
	/**
	 * Pop and return the next token from the queue, and update the position counter.
	 * @returns {WHILE_TOKEN}	The next token in the list
	 * @returns {null} 			If the token list is empty
	 */
	private _next(): WHILE_TOKEN|null {
		//Read the next token in the list
		const first = this._tokens.shift() || null;
		//Increment the position counter
		if (first !== null) {
			this._pos = {...first.pos};
			this._lastToken = first;
		} else {
			incrementPos(
				this._pos,
				this._lastToken?.value || ''
			);
		}
		//Return the token
		return first;
	}
}

// ================
// Parser functions
// ================

/**
 * Read an expression (hd/tl/cons) from the token list.
 * Returns a list containing the parser segment status, and the parsed expression tree.
 * @param state		The parser state manager object
 * @returns {[ParseStatus.OK, AST_EXPR]}			The parsed expression tree
 * @returns {[ParseStatus.ERROR, AST_EXPR|AST_EXPR_PARTIAL|null]}	The parsed expression with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_EXPR|AST_EXPR_PARTIAL|null]}		The parsed expression with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readExpr(state: StateManager): AST_EXPR|AST_EXPR_PARTIAL|null {
	let first = state.next();
	//Handle early end of input
	if (first === null) return null;

	//Support brackets around expressions
	if (first.value === TKN_PREN_OPN) {
		//Parse the expression between the brackets
		const expr: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);

		//Expect a closing parenthesis
		let close = state.next();
		if (close === null) {
			state.unexpectedEOI(TKN_PREN_CLS);
		} else if (close.value === TKN_PREN_CLS) {
			//Brackets match
		} else {
			state.unexpectedToken(close.value, TKN_PREN_CLS);
		}

		//Return the result of the expression
		return expr;
	}

	if (first.type === 'operation') {
		//Parse `hd` and `tl`
		if (first.value === TKN_HD || first.value === TKN_TL) {
			const arg: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);
			if (arg === null) {
				return {
					type: 'operation',
					complete: false,
					op: first,
					args: [arg]
				};
			} else if (arg.type === 'identifier' || arg.complete) {
				//The argument is an identifier or complete operation
				return {
					type: 'operation',
					complete: true,
					op: first,
					args: [arg]
				};
			} else {
				//The argument is an incomplete operation
				return {
					type: 'operation',
					complete: false,
					op: first,
					args: [arg]
				};
			}
		}

		//Parse `cons`
		const left: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);
		const right: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);
		if (!left || !right || (left.type === 'operation' && !left.complete) || (right.type === 'operation' && !right.complete)) {
			return {
				type: 'operation',
				complete: false,
				op: first,
				args: [
					left,
					right
				]
			};
		} else {
			return {
				type: 'operation',
				complete: true,
				op: first,
				args: [
					left,
					right
				]
			};
		}
	} else if (first.type === 'identifier') {
		return first;
	} else {
		state.unexpectedTokenCustom(first.value, 'Expected an expression or an identifier');
		return null;
	}
}

/**
 * Read the contents of an else block from the token list.
 * Returns a list containing the parser segment status, and list of parsed command trees
 * @param state		The parser state manager object
 * @returns {[ParseStatus.OK, (AST_CMD)[]]}			List of each statement in the else block
 * @returns {[ParseStatus.ERROR, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement in the else block, if readable, {@code null} where not possible
 * @returns {[ParseStatus.EOI, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement in the else block, if readable, {@code null} where not possible
 */
function _readElse(state: StateManager): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
	let peek = state.peek();
	if (peek === null) {
		//Unexpected end of input
		state.unexpectedEOI(TKN_BLOCK_CLS);
		return [ParseStatus.EOI, []];
	} else if (peek.value === TKN_ELSE) {
		//An else statement was provided
		state.next();
		return _readBlock(state);
	} else {
		//Assume there wasn't meant to be an else statement
		//I.e. treat it the same as `else {}`
		return [ParseStatus.OK, []];
	}
}

/**
 * Read a statement (if/if-else/while/assignment) from the program token list.
 * Returns a list containing the parser segment status, and the parsed command tree
 * @param state		The parser state manager object
 * @returns {[ParseStatus.OK, AST_CMD]}			The parsed statement
 * @returns {[ParseStatus.ERROR, AST_CMD|AST_CMD_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 * @returns {[ParseStatus.EOI, AST_CMD|AST_CMD_PARTIAL|null]}	The parsed statement with {@code null} where information can't be parsed, or {@code null} if it is unreadable
 */
function _readStmt(state: StateManager): [ParseStatus, AST_CMD|AST_CMD_PARTIAL|null] {
	let first = state.next();
	//Handle early end of input
	if (first === null) {
		return [ParseStatus.EOI, null];
	}

	if (first.value === TKN_IF) {
		//First attempt to read the condition expression
		let cond: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);
		//Then read the conditional body
		let [ifState, ifBlock]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readBlock(state);
		//And the 'else' body
		let [elseState, elseBlock]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readElse(state);
		//Return success if all the segments were parsed correctly
		if (cond !== null && (cond.type === 'identifier' || cond.complete) && ifState === ParseStatus.OK && elseState === ParseStatus.OK) {
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
		let cond = _readExpr(state);
		let [bodyState, body]: [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] = _readBlock(state);
		if (bodyState === ParseStatus.OK && cond !== null) {
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
				(bodyState === ParseStatus.EOI) ? ParseStatus.EOI : ParseStatus.ERROR,
				{
					type: 'loop',
					complete: false,
					condition: cond,
					body: body,
				}
			];
		}
	} else if (first.type === 'identifier') {
		state.expect(TKN_ASSGN);
		const val: AST_EXPR|AST_EXPR_PARTIAL|null = _readExpr(state);
		if (val !== null && (val.type === 'identifier' || val.complete)) {
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
	}
	state.unexpectedTokenCustom(undefined, `Expected ${TKN_IF} ${TKN_WHILE} or an assignment statement`);
	return [ParseStatus.ERROR, null];
}

/**
 * Read a block of statements from the token list.
 * Returns a list containing the parser segment status, and the list of the parsed command trees.
 * See also: {@link _readStmt}
 * @param state		The parser state manager object
 * @returns {[ParseStatus.OK, (AST_CMD)[]]}			List of each statement in the block
 * @returns {[ParseStatus.ERROR, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement, if readable, {@code null} where not possible
 * @returns {[ParseStatus.EOI, (AST_CMD|AST_CMD_PARTIAL|null)[]]}	List of each statement, if readable, {@code null} where not possible
 */
function _readBlock(state: StateManager): [ParseStatus, (AST_CMD|AST_CMD_PARTIAL|null)[]] {
	state.expect(TKN_BLOCK_OPN);

	const first: WHILE_TOKEN|null = state.peek();
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

	let res: (AST_CMD|AST_CMD_PARTIAL|null)[] = [];
	let status: ParseStatus = ParseStatus.OK;
	while (true) {
		const [statementStatus, statement]: [ParseStatus, AST_CMD|AST_CMD_PARTIAL|null] = _readStmt(state);
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

		let next: WHILE_TOKEN|null = state.next();
		if (next === null) {
			state.unexpectedEOI(TKN_SEP, TKN_BLOCK_CLS);
			status = ParseStatus.EOI;
			break;
		} else if (next.value == TKN_SEP) {
			//Move on to the next statement
		} else if (next.value == TKN_BLOCK_CLS) {
			//End of block
			break;
		} else {
			//Report error expecting a separator or a block close
			state.unexpectedToken(next.value, TKN_SEP, TKN_BLOCK_CLS);
			status = ParseStatus.ERROR;
		}
	}

	return [status, res];
}

/**
 * Read the "<name> read <input>" from the start of the token list.
 * Returns a list containing the parser segment status, the program name, and the input variable.
 * @param state		The parser state manager object
 * @returns {[ParseStatus.OK, IDENT_TYPE, IDENT_TYPE]}			The program name, and input variable
 * @returns {[ParseStatus.ERROR, IDENT_TYPE|null, IDENT_TYPE|null]}	The program name and input variable if readable, {@code null} for each otherwise
 * @returns {[ParseStatus.EOI, IDENT_TYPE|null, IDENT_TYPE|null]}	The program name and input variable if readable, {@code null} for each otherwise
 */
function _readProgramIntro(state: StateManager): [ParseStatus, IDENT_TYPE|null, IDENT_TYPE|null] {
	function _readInput(state: StateManager): [ParseStatus, IDENT_TYPE|null] {
		const input: WHILE_TOKEN|null = state.peek();
		if (input === null) {
			state.next();
			state.unexpectedEOICustom(`Missing input variable`);
			return [ParseStatus.EOI, null];
		} else if (input.value === TKN_BLOCK_OPN) {
			state.errorManager.addError(input.pos, `Unexpected token "${input.value}": Missing input variable`);
			return [ParseStatus.ERROR, null];
		} else if (input.type === 'identifier') {
			state.next();
			//Acceptable token
			return [ParseStatus.OK, input];
		} else {
			state.next();
			//Not an identifier
			return [ParseStatus.ERROR, null];
		}
	}

	function _readRead(state: StateManager): [ParseStatus, IDENT_TYPE|null] {
		//"read"
		const read: WHILE_TOKEN|null = state.peek();
		if (read === null) {
			state.next();
			state.unexpectedEOI(TKN_READ);
			return [ParseStatus.EOI, null];
		} else if (read.value === TKN_READ) {
			state.next();
			//Expected
			return _readInput(state);
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
	let name: WHILE_TOKEN|null = state.peek();
	if (name === null) {
		state.next();
		state.unexpectedEOICustom(`Missing program name`);
		return [ParseStatus.EOI, null, null];
	} else if (name.value === TKN_READ) {
		state.next();
		//The program name was missed
		state.errorManager.addError(name.pos, 'Unexpected token: Missing program name');
		let [inputStatus, input] = _readInput(state);
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
		let [inputStatus, inputVar]: [ParseStatus, IDENT_TYPE|null] = _readRead(state);
		//A program name wasn't provided
		if (name.type !== 'identifier') return [ParseStatus.ERROR, null, inputVar];
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
 * @returns {[ParseStatus.OK, IDENT_TYPE]}			The output variable
 * @returns {[ParseStatus.ERROR, IDENT_TYPE|null]}	The output variable, if readable, {@code null} otherwise
 * @returns {[ParseStatus.EOI, IDENT_TYPE|null]}	The output variable, if readable, {@code null} otherwise
 */
function _readProgramOutro(state: StateManager): [ParseStatus, IDENT_TYPE|null] {
	let err: ParseStatus = ParseStatus.OK;
	let output: IDENT_TYPE|null = null;

	//read the "write" token
	let write: WHILE_TOKEN|null = state.next();
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
	let outputVar: WHILE_TOKEN|null = state.next();
	if (outputVar === null) {
		state.unexpectedEOI('identifier');
		err = ParseStatus.EOI;
	} else if (outputVar.type !== 'identifier') {
		state.unexpectedTokenCustom(outputVar.value, ` Expected an identifier`);
		err = ParseStatus.ERROR;
	} else {
		output = outputVar;
	}

	return [err, output];
}

/**
 * Read the root structure of a program from the token list
 * This is the {@code <prog> read <in> { ... } write <out>}
 * @param state		The parser state manager object
 * @returns AST_PROG			When a program was parsed without issue
 * @returns AST_PROG_PARTIAL	When at least one error was encountered with the program
 */
function _readProgram(state: StateManager): AST_PROG|AST_PROG_PARTIAL {
	let bodyStatus: ParseStatus = ParseStatus.OK;
	let outputStatus: ParseStatus = ParseStatus.OK;
	let body: (AST_CMD|AST_CMD_PARTIAL|null)[] = [];
	let output: IDENT_TYPE|null = null;

	//Attempt to read the start of the program ("<name> read <in>")
	//Separate into the program name and input variable name
	let [progInStatus, name, input]: [ParseStatus, IDENT_TYPE|null, IDENT_TYPE|null] = _readProgramIntro(state);

	//Don't attempt to parse the program if the input has already ended
	if (progInStatus !== ParseStatus.EOI) {
		//Read the program body
		[bodyStatus, body] = _readBlock(state);
		if (bodyStatus !== ParseStatus.EOI) {
			//Read the outro of the program ("write <out>")
			[outputStatus, output] = _readProgramOutro(state);
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
 * @return	An abstract syntax tree representing the program, and a list of all the errors in the program
 */
export default function parser(tokens: WHILE_TOKEN[]) : [AST_PROG|AST_PROG_PARTIAL, ErrorType[]] {
	//Make a state manager object for use in the parser
	const stateManager = new StateManager(tokens);
	//Parse the program
	const prog: AST_PROG|AST_PROG_PARTIAL = _readProgram(stateManager);
	//Return the program and any discovered errors
	return [prog, stateManager.errors];
}