import Position from "../types/position";

/**
 * Iterator class through a string that maintains a line/column index throughout iteration
 */
export class PositionalIterator {
	private _str: string;
	private _line: number;
	private _col: number;

	public constructor(str: string) {
		this._str = str;
		this._line = 0;
		this._col = 0;
	}

	/**
	 * Get the number of characters which have not yet been iterated over
	 */
	public get remaining() {
		return this._str.length;
	}

	/**
	 * Get the Position object representing the current position in the string
	 */
	public getPosition(): Position {
		return {
			row: this._line,
			col: this._col,
		}
	}

	/**
	 * Whether there are any remaining un-iterated characters
	 */
	public hasNext(): boolean {
		return this.remaining > 0;
	}

	/**
	 * Return the next `n` characters from the string.
	 * Each returned character is consumed.
	 * @param n		The number of characters to return
	 */
	public next(n: number = 1): string {
		//Get the first n characters
		let chars = this._str.substring(0, n);
		//Remove these from the front of the string
		this._str = this._str.substring(n);
		//Increment the position
		this._incrementPos(chars);
		//And return
		return chars;
	}

	/**
	 * Read to the next end-of-line character.
	 * All characters up to the line break (exclusive) are consumed and returned.
	 * If there are no line breaks remaining in the string, all characters up to the end are returned
	 */
	public nextEOL(): string {
		//Count the number of characters to the next line break
		let len = this.matchLength(/.*?(\r?\n|$)/);
		//There is not a line break, read to the end of the string.
		if (len === -1) len = this.remaining;
		return this.next(len);
	}

	/**
	 * Test whether the next characters match a specific RegEx or string of characters, and return the length of the match.
	 * If no match is found, it returns -1.
	 * No characters are consumed.
	 * The RegEx must start with `^` to guarantee semantics.
	 * @param pattern	Either a literal string to compare against, or a RegEx to test.
	 */
	public matchLength(pattern: RegExp | string): number {
		if (typeof pattern === 'string') {
			//Check if the string starts with the pattern
			if (this._str.startsWith(pattern)) return pattern.length;
			//Check if the string starts with the pattern
			return -1;
		}
		//Check if the string matches the RegEx
		let r = pattern.exec(this._str);
		//Return the length of the match or -1
		return r ? r[0].length : -1;
	}

	/**
	 * Test whether the next characters match a specific RegEx or string of characters.
	 * Returns true if a match is found, or false otherwise.
	 * No characters are consumed.
	 * @param pattern	Either a literal string to compare against, or a RegEx to test.
	 */
	public matches(pattern: RegExp | string): boolean {
		return this.matchLength(pattern) >= 0;
	}

	/**
	 * Test whether the next characters match a specific RegEx or string of characters, and consumes the characters if
	 * a match is found.
	 * If a match is not found, no characters are consumed.
	 * Returns true if the match was found, or false otherwise.
	 * @param pattern	Either a literal string to compare against, or a RegEx to test.
	 */
	public matchAndConsume(pattern: RegExp | string): boolean {
		//Find the length of the match
		let length = this.matchLength(pattern);
		//No match
		if (length === -1) return false;
		//Consume the characters
		this.next(length);
		return true;
	}

	/**
	 * Return the number of characters to the start of a string of characters or a matching pattern.
	 * No characters are consumed.
	 * Returns -1 if the pattern is not matched
	 * @param pattern	Either a literal string to find, or a RegEx to test.
	 */
	public search(pattern: string | RegExp): number {
		if (typeof pattern === 'string')
			return this._str.indexOf(pattern);
		return this._str.search(pattern);
	}

	/**
	 * Automatically increment the row/column pointers to a position object from a string.
	 * At each {@code \n} the row counter is incremented and the column counter reset.
	 * Every other character increments the column counter.
	 * @param str	the string to use to increment the pointer.
	 */
	private _incrementPos(str: string): void {
		//Count the number of line breaks in the string
		let lineBreaks = (str.match(/\n/g) || []).length;
		//No line breaks - just increment the column
		if (lineBreaks === 0) this._col += str.length;
		else {
			//Increment the number of lines
			this._line += lineBreaks;
			//Increment the column by the number of characters after the last line break
			this._col = str.length - (str.lastIndexOf('\n') + 1);
		}
	}
}