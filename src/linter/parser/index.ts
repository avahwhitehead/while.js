import {
	IDENT_TYPE,
	TKN_ASSGN,
	TKN_BLOCK_CLS,
	TKN_BLOCK_OPN,
	TKN_ELSE,
	TKN_HD,
	TKN_IF, TKN_PREN_CLS, TKN_PREN_OPN,
	TKN_READ,
	TKN_SEP,
	TKN_TL,
	TKN_WHILE,
	TKN_WRITE,
	WHILE_TOKEN
} from "../lexer";
import { AST_CMD, AST_EXPR, AST_PROG, } from "../../types/ast";

type ErrorType = {
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
			if (actual) msg += `got "${actual}"`;
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
	private _pos: number;

	public constructor(tokens: WHILE_TOKEN[]) {
		this._pos = 0;
		this._errorManager = new ErrorManager();
		this._tokens = tokens;
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
		if (first === null) {
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
		if (first === null) {
			this.unexpectedEOI(...expected);
			return null;
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
	 * Get the next token in the token list without removing from the queue.
	 */
	public peek(): WHILE_TOKEN|undefined {
		return this._tokens[0];
	}

	//Errors

	/**
	 * Add an error message at the current token
	 * @param msg	The message
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

	//Internal util methods
	/**
	 * Pop and return the next token from the queue, and update the position counter.
	 * @private
	 */
	private _next(): WHILE_TOKEN|null {
		//Read the next token in the list
		const first = this._tokens.shift() || null;
		//Increment the position counter
		if (first !== null) this._pos += first.value.length;
		//Return the token
		return first;
	}
}

// ================
// Parser functions
// ================

function _readExpr(state: StateManager): AST_EXPR|null {
	//Support brackets around expressions
	if (state.peek()?.value === TKN_PREN_OPN) {
		state.consume();
		const expr = _readExpr(state);
		state.consume(TKN_PREN_CLS);
		return expr;
	}

	let first = state.consumeType('operation', 'identifier');
	//TODO: Handle error
	if (first === null) return null;

	if (first.type === 'operation') {
		if (first.value === TKN_HD || first.value === TKN_TL) {
			const val: AST_EXPR|null = _readExpr(state);
			if (val === null) return null;
			return {
				type: 'operation',
				op: first,
				args: [ val ]
			};
		}

		const left = _readExpr(state);
		const right = _readExpr(state);
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

	//TODO: Handle unknown type
	state.unexpectedValue(first.type, first.value, 'identifier', 'expression');
	return null;
}

/**
 * Read a statement from the program token list.
 * If(-else)/while/assigment operations
 * @param state	Program state object
 */
function _readStmt(state: StateManager): AST_CMD|null {
	let first = state.consume();
	//TODO: Handle invalid value
	if (first === null) return null;

	if (first.value === TKN_IF) {
		let cond = _readExpr(state);
		let ifBlock: AST_CMD[] = _readBlock(state);
		let elseBlock: AST_CMD[] = [];
		if (state.peek()?.value === TKN_ELSE) {
			state.consume();
			elseBlock = _readBlock(state);
		}
		if (cond === null) return null;
		return {
			type: 'cond',
			condition: cond,
			if: ifBlock,
			else: elseBlock,
		};
	} else if (first.value === TKN_WHILE) {
		let cond = _readExpr(state);
		let body: AST_CMD[] = _readBlock(state);
		if (cond === null) return null;
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

//TODO: Handle parens ()

/**
 * Read a block of code from the token list
 * @param state	Program state object
 */
function _readBlock(state: StateManager): AST_CMD[] {
	state.consume(TKN_BLOCK_OPN);

	if (state.peek()!.value === TKN_BLOCK_CLS) {
		state.consume();
		return [];
	}

	let res: AST_CMD[] = [];
	let next: WHILE_TOKEN | null;
	do {
		const statement = _readStmt(state);
		if (statement !== null) res.push(statement);
		next = state.consume(TKN_SEP, TKN_BLOCK_CLS);
	} while (next !== null && next.value === TKN_SEP);

	return res;
}

/**
 * Read the root program structure from the program
 * @param state	Program state object
 */
function _readProgram(state: StateManager): AST_PROG {
	//Program name
	let name: IDENT_TYPE = state.consumeType('identifier') as IDENT_TYPE;
	//"read"
	state.consume(TKN_READ);
	//Input variable
	let input: IDENT_TYPE = state.consumeType('identifier') as IDENT_TYPE;
	//Program body
	let body: AST_CMD[] = _readBlock(state);
	//"write"
	state.consume(TKN_WRITE);
	//Output variable
	let output: IDENT_TYPE = state.consumeType('identifier') as IDENT_TYPE;

	return {
		type: 'program',
		input,
		output,
		name,
		body,
	}
}

/**
 * Parse a token list (from the lexer) to an abstract syntax tree
 * @param tokens	The program tokens to parse
 * @return	An abstract syntax tree representing the program, and a list of all the errors in the program
 */
export default function parser(tokens: WHILE_TOKEN[]) : [AST_PROG, ErrorType[]] {
	//Make a state manager object for use in the parser
	const stateManager = new StateManager(tokens);
	//Parse the program
	const prog: AST_PROG = _readProgram(stateManager);
	//Return the program and any discovered errors
	return [prog, stateManager.errors];
}