/**
 * Represents the position of a token (or other information) in the original program string.
 */
export default interface Position {
	/**
	 * The row number (0-indexed)
	 */
	row: number,
	/**
	 * The column number (0-indexed)
	 */
	col: number,
};

/**
 * Automatically increment the row/column pointers to a position object from a string.
 * At each {@code \n} the row counter is incremented and the column counter reset.
 * Every other character increments the column counter.
 * @param pos	The Position object
 * @param str	the string to use to increment the pointer.
 */
export function incrementPos(pos: Position, str: string): void {
	for (let c of str) {
		if (c === '\n') {
			pos.row++;
			pos.col = 0;
		} else {
			pos.col++;
		}
	}
}