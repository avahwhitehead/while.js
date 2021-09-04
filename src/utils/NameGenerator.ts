/**
 * Generator class to sequentially create unique strings.
 * Strings start at 'A', then 'B', 'C' etc until 'Z', then 'AA', 'AB', ... 'ZZ', 'AAA', 'AAB', ...
 */
export default class NameGenerator {
	private readonly _nextName: string[];

	/**
	 * @param minLength		The length of the first string to produce.
	 * 						The first string is the character 'A' repeated {@code minLength} times.
	 */
	constructor(minLength = 1) {
		if (minLength <= 0) minLength = 1;
		this._nextName = [];
		for (let i = 0; i < minLength; i++) this._nextName.push('A');
	}

	/**
	 * Get the next string in the generator.
	 * @param increment		Whether to mark the name as completed and move onto the next name.
	 * 						Using {@code false} will return the same value on the next iteration.
	 * 						{@code true} will produce a new value on the next iteration.
	 */
	public next(increment: boolean = true): string {
		//Join the name from a list into the name string
		let res = this._nextName.join('');
		//Increment the stored value if requested
		if (increment) this._incrementName();
		//Return the string
		return res;
	}

	private _incrementName(): void {
		/**
		 * Get the following character, overflowing if required
		 * @param c		The current character value.
		 * @returns {[string, boolean]} The next value in the character's value, and whether or not the character has
		 * 								looped round.
		 */
		function _nextChar(c: string): [string, boolean] {
			//Character code of the following character
			let code = c.charCodeAt(0) + 1;
			//Overflow back to 'A' if the character has passed 'Z'
			if (code > 'Z'.charCodeAt(0)) return ['A', true];
			//Otherwise return the new character
			return [String.fromCharCode(code), false];
		}

		//Increment the string by 1, overflowing where required
		let c: string;
		let looped: boolean;
		let i = this._nextName.length - 1;
		do {
			[c, looped] = _nextChar(this._nextName[i]);
			this._nextName[i] = c;
			if (i === 0 && looped) {
				this._nextName.splice(0, 0, 'A');
				break;
			} else {
				i--;
			}
		} while (looped);
	}
}