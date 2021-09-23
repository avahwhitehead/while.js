/**
 * Options for creating a {@link StringBuilder} object
 */
export interface StringBuilderProps {
	/**
	 * String to use for indenting lines.
	 * Default is {@code '    '} (4 spaces)
	 */
	indent: string;
	/**
	 * String to use for line breaks.
	 * Default is {@code '\n')}
	 */
	linebreak: string;
}

/**
 * Utility class to simplify creating strings for output.
 */
export class StringBuilder {
	private readonly _lines: [number, string][];
	private _level: number;
	private _props: StringBuilderProps;

	constructor(props: Partial<StringBuilderProps>) {
		this._level = 0;
		this._lines = [[0, '']];
		this._props = {
			indent: (props.indent !== undefined) ? props.indent : '    ',
			linebreak: (props.linebreak !== undefined) ? props.linebreak : '\n',
		};
	}

	/**
	 * Indent the current line.
	 * @returns this	For chaining operations
	 */
	public indent(): this {
		//Indent the current line, and save for future lines
		this._lines[this._lines.length - 1][0] = ++this._level;
		return this;
	}

	/**
	 *Remove an indentation level from the current line.
	 * @returns this	For chaining operations
	 */
	public dedent(): this {
		if (this._level > 0) this._level--;
		this._lines[this._lines.length - 1][0]--;
		return this;
	}

	/**
	 * Add a new line to the end of the string
	 * @param line		The line to add
	 * @returns this	For chaining operations
	 */
	public push(line: string | number): this {
		this._lines.push([this._level, line.toString()]);
		return this;
	}

	/**
	 * Add some text to the end of the current line
	 * @param text		The text to add
	 * @returns this	For chaining operations
	 */
	public add(text: string | number): this {
		this._lines[this._lines.length - 1][1] += text;
		return this;
	}

	/**
	 * Add a new empty line to the end of the string
	 * @returns this	For chaining operations
	 */
	public break(): this {
		this._lines.push([this._level, '']);
		return this;
	}

	public toString(): string {
		return this._lines.map(([i, t]) => this.props.indent.repeat(i) + t).join(this.props.linebreak);
	}

	get level(): number {
		return this._level;
	}

	set level(value: number) {
		this._level = value;
		this._lines[this._lines.length - 1][0] = value;
	}

	get props(): StringBuilderProps {
		return this._props;
	}

	set props(value: StringBuilderProps) {
		this._props = value;
	}

	get lines(): [number, string][] {
		return this._lines;
	}
}