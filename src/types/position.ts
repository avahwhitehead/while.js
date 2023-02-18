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
