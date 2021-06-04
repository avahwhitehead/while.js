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
} from "../lexer";
import { AST_CMD, AST_EXPR, AST_PROG, } from "../../types/ast";

export type ErrorType = {
	position: number,
	message: string,
}

class ErrorManager {
	private readonly _errors: ErrorType[];

	public constructor() {
		this._errors = [];
	}

	/**
	 * List of all the errors added to this object
	 */
	public get errors(): ErrorType[] {
		return this._errors;
	}

	/**
	 * Add an error to the list
	 * @param position	The position of the error in the program
	 * @param message	Message describing the error
	 */
	public addError(position: number, message: string): this {
		this._errors.push({
			message,
			position,
		});
		return this;
	}

	public unexpectedToken(position: number, actual?: string, ...expected: string[]): this {
		return this.unexpectedValue(position, 'token', actual, ...expected);
	}

	public unexpectedEOI(position: number, ...expected: string[]): this {
		return this.unexpectedValue(position, 'end of input', undefined, ...expected);
	}

	public unexpectedValue(position: number, type: string = 'token', actual?: string, ...expected: string[]): this {
		let msg = `Unexpected ${type}`;
		if (expected.length === 0) {
			if (actual) msg += `: "${actual}"`;
		} else {
			if (expected.length === 1) msg += `: Expected "${expected[0]}"`;
			else msg += `: Expected one of "${expected.join(`", "`)}"`;
			if (actual) msg += ` got "${actual}"`;
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
	private _lastToken: WHILE_TOKEN;

	private get _pos(): number {
		return this._lastToken.pos || 0;
	}

	public constructor(tokens: WHILE_TOKEN[]) {
		this._errorManager = new ErrorManager();
		this._tokens = tokens;
		this._lastToken = {
			type: 'eoi',
			pos: 0,
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
	 * Pop a token from the start of the token list.
	 * Optionally, provide a list of the acceptable tokens.
	 * Automatically produces an error if the token list ends prematurely, or if the token is an unexpected value.
	 * @param expected	List of the tokens to accept here.
	 * 					Empty for any token.
	 */
	public consume(...expected: string[]): WHILE_TOKEN|null {
		const first = this._next();
		//Unexpected end of token list
		if (first.type === 'eoi') {
			this.unexpectedEOI(...expected);
			return null;
		}

		//Allow any token if no expected was provided
		if (expected.length === 0) return first;
		//The token matches the expected value
		for (let exp of expected) {
			if (first.value === exp) return first;
		}

		//The token is unexpected - add an error
		this.unexpectedToken(first.value, ...expected);
		return null;
	}

	/**
	 * Same as {@link consume} but for types of token instead of values.
	 * @param expected	List of the token types to accept here.
	 * 					Empty for any type.
	 */
	public consumeType(...expected: ('symbol'|'expression'|'identifier'|'operation'|'unknown')[]): WHILE_TOKEN|null {
		const first = this._next();
		//Unexpected end of token list
		if (first.type === 'eoi') {
			this.unexpectedEOI(...expected);
			return first;
		}

		//Allow any token if no expected was provided
		if (expected.length === 0) return first;
		//The token matches the expected value
		for (let exp of expected) {
			if (first.type === exp) return first;
		}

		//The token is unexpected - add an error
		this.unexpectedValue('type', first.value, ...expected);
		return null;
	}

	/**
	 * Get the next token in the token list and remove from the queue.
	 */
	public next(): WHILE_TOKEN {
		return this._next();
	}

	/**
	 * Get the next token in the token list without removing from the queue.
	 * @return {WHILE_TOKEN} 	The first token in the list, or the the last returned token (an EOI) if the list is empty.
	 */
	public peek(): WHILE_TOKEN {
		return (this._tokens[0] !== undefined) ? this._tokens[0] : this._lastToken;
	}

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
	 * Add an unexpected type message at the current token
	 * @param actual	The unexpected value
	 * @param expected	The expected value(s)
	 * @example		{@code unexpectedValue('number', '10', '20)} -> {@code "Unexpected number: Expected 20 got 10"}
	 */
	public unexpectedType(actual?: string, ...expected: string[]): this {
		this._errorManager.unexpectedValue(this._pos, 'type', actual, ...expected);
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

	//Internal util methods
	/**
	 * Pop and return the next token from the queue, and update the position counter.
	 * When the list is empty, the last token (an EOI) is returned instead.
	 * @private
	 */
	private _next(): WHILE_TOKEN {
		//Read the next token in the list
		const first = this._tokens.shift() || null;
		//Increment the position counter
		if (first === null) {
			return this._lastToken;
		}
		this._lastToken = first;
		//Return the token
		return first;
	}
}

// ================
// Parser functions
// ================

function _readExpr(state: StateManager): AST_EXPR|null {
	let first = state.next();
	//Handle early end of input
	if (first.type === 'eoi') return null;

	//Support brackets around expressions
	if (first.value === TKN_PREN_OPN) {
		//Parse the expression between the brackets
		const expr: AST_EXPR|null = _readExpr(state);

		//Expect a closing parenthesis
		let close = state.next();
		if (close.type === 'eoi') {
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
			const val: AST_EXPR|null = _readExpr(state);
			if (val === null) return null;
			return {
				type: 'operation',
				op: first,
				args: [ val ]
			};
		}

		//Parse `cons`
		const left: AST_EXPR|null = _readExpr(state);
		const right: AST_EXPR|null = _readExpr(state);
		//TODO: Is this the best place? May allow better linting
		if (left == null || right === null) return null;
		return {
			type: 'operation',
			op: first,
			args: [
				left,
				right
			]
		};
	} else if (first.type === 'identifier') {
		return first;
	}

	state.unexpectedType(first.type, 'operation', 'identifier');
	return null;
}

/**
 * Read the contents of an else block
 * @param state
 */
function _readElse(state: StateManager): AST_CMD[]|null {
	let peek = state.peek();
	if (peek.type === 'eoi') {
		return null;
	} else if (peek.value === TKN_ELSE) {
		state.next();
		return _readBlock(state);
	} else {
		return [];
	}
}

/**
 * Read a statement from the program token list.
 * If(-else)/while/assigment operations
 * @param state	Program state object
 */
function _readStmt(state: StateManager): AST_CMD|null {
	let first = state.next();
	//Handle early end of input
	if (first.type === 'eoi') {
		// return first;
		return null;
	}

	if (first.value === TKN_IF) {
		//First attempt to read the condition expression
		let cond = _readExpr(state);
		//Then read the conditional body
		let ifBlock: AST_CMD[]|null = _readBlock(state);
		//And the 'else' body
		let elseBlock: AST_CMD[]|null = _readElse(state);
		//Return `null` if any of the segments couldn't be parsed
		if (cond === null || ifBlock === null || elseBlock === null) return null;
		//Return the produced AST node
		return {
			type: 'cond',
			condition: cond,
			if: ifBlock,
			else: elseBlock,
		};
	} else if (first.value === TKN_WHILE) {
		let cond = _readExpr(state);
		let body: AST_CMD[]|null = _readBlock(state);
		if (body === null || cond === null) return null;
		return {
			type: 'loop',
			condition: cond,
			body: body,
		};
	} else if (first.type === 'identifier') {
		state.consume(TKN_ASSGN);
		const val: AST_EXPR|null = _readExpr(state);
		if (val === null) return null;
		return {
			type: 'assign',
			ident: first,
			arg: val
		}
	}
	state.unexpectedToken(undefined, TKN_WHILE, TKN_IF, 'assignment');
	return null;
}

/**
 * Read a block of code from the token list
 * @param state	Program state object
 */
function _readBlock(state: StateManager): AST_CMD[]|null {
	state.consume(TKN_BLOCK_OPN);

	const first = state.peek();
	if (first.type === 'eoi') {
		state.next();
		state.unexpectedEOI(TKN_BLOCK_CLS);
		return null;
	} else if (first.value === TKN_BLOCK_CLS) {
		//Empty loop body
		state.next();
		return [];
	}

	let res: AST_CMD[] = [];
	while (true) {
		const statement: AST_CMD|null = _readStmt(state);
		if (statement !== null) res.push(statement);

		let next: WHILE_TOKEN = state.next();
		if (next.type == 'eoi') {
			state.unexpectedEOI(TKN_SEP, TKN_BLOCK_CLS);
			return null;
			// return res;
		} else if (next.value == TKN_SEP) {
			//Move on to the next statement
		} else if (next.value == TKN_BLOCK_CLS) {
			//End of block
			break;
		} else {
			//TODO: Handle missing separator
			//Report error expecting a separator or a block close
			state.unexpectedToken(next.value, TKN_SEP, TKN_BLOCK_CLS);
		}
	}

	return res;
}

/**
 * Read the "<name> read <input>" from the start of the token list.
 * @param state		The state manager object
 */
function _readProgramIntro(state: StateManager): [IDENT_TYPE|null, IDENT_TYPE|null]|null {
	function _readInput(state: StateManager): IDENT_TYPE|null|undefined {
		const input = state.peek();
		if (input.type === 'eoi') {
			state.next();
			//TODO: Better EOI error
			state.addError('Unexpected end of input: Missing input variable');
			return undefined;
		} else if (input.value === TKN_BLOCK_OPN) {
			state.errorManager.addError(input.pos, 'Missing input variable');
			return null;
		} else if (input.type === 'identifier') {
			state.next();
			//Acceptable token
			return input;
		} else {
			state.next();
			//Not an identifier
			return null;
		}
	}

	function _readRead(state: StateManager): IDENT_TYPE|null|undefined {
		//"read"
		const read = state.peek();
		if (read.type === 'eoi') {
			state.next();
			state.unexpectedEOI(TKN_READ);
			return undefined;
		} else if (read.value === TKN_READ) {
			state.next();
			//Expected
			return _readInput(state);
		} else if (read.value === TKN_BLOCK_OPN) {
			//The program opens directly onto the block
			state.errorManager.unexpectedToken(read.pos, undefined, TKN_READ);
			return null;
		} else {
			state.next();
			state.unexpectedToken(read.value, TKN_READ);
			//TODO: What to return here?
			return null;
		}
	}

	//Program name
	let name: WHILE_TOKEN = state.peek();
	if (name.type === 'eoi') {
		state.next();
		state.addError('Unexpected end of input: Missing program name');
		return null;
	} else if (name.value === TKN_READ) {
		state.next();
		//The program name was missed
		state.errorManager.addError(name.pos, 'Unexpected token: Missing program name');
		let inputVar = _readInput(state);
		if (inputVar === undefined) return null;
		return [null, inputVar];
	} else if (name.value === TKN_BLOCK_OPN) {
		//The program opens directly onto the block
		state.errorManager.addError(name.pos, 'Unexpected token: Missing program name');
		state.errorManager.unexpectedToken(name.pos, undefined, TKN_READ);
		return [null, null];
	} else {
		state.next();
		let inputVar = _readRead(state);
		if (inputVar === undefined) return null;
		//A program name wasn't provided
		if (name.type !== 'identifier') return [null, inputVar];
		//Acceptable token
		return [name as IDENT_TYPE, inputVar];
	}
}

/**
 * Read the root program structure from the program
 * @param state	Program state object
 */
function _readProgram(state: StateManager): AST_PROG|null {
	let progIn: null|[IDENT_TYPE|null, IDENT_TYPE|null] = _readProgramIntro(state);
	if (progIn === null) return null;
	let [name, input]: [IDENT_TYPE|null, IDENT_TYPE|null] = progIn;

	//Program body
	let body: AST_CMD[]|null = _readBlock(state);
	if (body === null) return null;

	//TODO: Better error messages for missing "write" cases

	//"write"
	let write: WHILE_TOKEN|null = state.next();
	if (write.type === 'eoi') {
		state.unexpectedEOI(TKN_WRITE);
		write = null;
	} else if (write.value === TKN_WRITE) {
		//Expected value
	} else if (write.type === 'identifier') {
		state.unexpectedToken(write.value, TKN_WRITE);
	} else {
		//TODO: Change all `state.unexpectedToken` to `state.unexpectedValue(write.type, write.value, TKN_WRITE)`
		state.unexpectedToken(write.value, TKN_WRITE);
		write = null;
	}
	//Output variable
	let output: WHILE_TOKEN|null = state.next();
	if (output.type === 'eoi') {
		state.unexpectedEOI('identifier');
		output = null;
	} else if (output.type !== 'identifier') {
		//TODO: Change all `state.unexpectedToken` to `state.unexpectedValue(write.type, write.value, TKN_WRITE)`
		state.unexpectedType(output.value, 'identifier');
		output = null;
	}

	if (name === null || input === null || output === null) return null;

	//Expect that the token list ends here
	const final = state.next();
	if (final.type !== 'eoi') {
		state.unexpectedToken(final.value, 'end of input');
	}

	//Return the produced program
	return {
		type: 'program',
		input,
		output,
		name,
		body,
	}
}

/**
 * Parse a token list (from the lexer) to an abstract syntax tree.
 * The token list must end in an EOI token for the parser to function.
 * @param tokens	The program tokens to parse
 * @return	An abstract syntax tree representing the program, and a list of all the errors in the program
 */
export default function parser(tokens: WHILE_TOKEN[]) : [AST_PROG|null, ErrorType[]] {
	//Ensure the token list ends with an EOI token
	if (!tokens.length || tokens[tokens.length - 1].type !== 'eoi') {
		throw new Error(`The token list must end in an End of Input token`);
	}

	//Make a state manager object for use in the parser
	const stateManager = new StateManager(tokens);
	//Parse the program
	const prog: AST_PROG|null = _readProgram(stateManager);
	//Return the program and any discovered errors
	return [prog, stateManager.errors];
}