import Position from "../types/position";

/**
 * Type representing an error message at a position in the input program
 */
export type ErrorType = {
	position: Position,
	message: string,
}

/**
 * Manager object to simplify the process of creating multiple errors at locations in the input code
 */
export class ErrorManager {
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
	public addError(position: Position, message: string): this {
		this._errors.push({
			message,
			position: {...position},
		});
		return this;
	}
}