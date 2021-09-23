import VariableNamespaceManager, { VariableManager } from "../utils/VariableManager";
import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";
import { StringBuilder } from "../utils/StringBuilder";

/**
 * Data type for the programs-as-data representation of a WHILE expression.
 */
export type DataExprType = ['var', number]
	| ['quote', string]
	| ['cons', DataExprType, DataExprType]
	| ['hd', DataExprType]
	| ['tl', DataExprType];
/**
 * Data type for the programs-as-data representation of a WHILE command.
 */
export type DataBodyType = [':=', number, DataExprType]
	| ['while', DataExprType, DataBodyType[]]
	| ['if', DataExprType, DataBodyType[], DataBodyType[]]
/**
 * Data type for the programs-as-data representation of a WHILE program.
 */
export type ProgDataType = [number, DataBodyType[], number];

/**
 * Convert a program AST to the programs-as-data format.
 * The AST must be for a pure WHILE program.
 * @returns {ProgDataType}	The program-as-data representation of the program
 * @throws Error	Error if the program is not in pure WHILE format
 */
export default function toPad(prog: AST_PROG): ProgDataType {
	//Create a variable manager for the conversion
	let manager: VariableManager = new VariableManager();
	manager.add(prog.input.value);

	//Convert each command of the program body to the data representation
	let programBody: DataBodyType[] = [];
	for (let el of prog.body) {
		programBody.push(_convertToData(el, manager));
	}

	//Return the program's data representation
	return [
		manager.index(prog.input.value)!,
		programBody,
		manager.add(prog.output.value),
	];
}

/**
 * Convert a program command to its data representation
 * @param line		The command to convert
 * @param manager	Variable manager to assist with converting the command
 * @private
 */
function _convertToData(line: AST_CMD, manager: VariableManager): DataBodyType {
	switch (line.type) {
		case "assign":
			return [
				':=',
				manager.add(line.ident.value),
				_convertToDataExpr(line.arg, manager)
			];
		case "cond":
			return [
				'if',
				_convertToDataExpr(line.condition, manager),
				line.if.map(l => _convertToData(l, manager)),
				line.else.map(l => _convertToData(l, manager)),
			];
		case "loop":
			return [
				'while',
				_convertToDataExpr(line.condition, manager),
				line.body.map(l => _convertToData(l, manager)),
			];
		default:
			throw new Error(`Unsupported feature '${line.type}'. Ensure the program is in pure WHILE.`);
	}
}

/**
 * Convert an expression to its data representation
 * @param line		The expression to convert
 * @param manager	Variable manager to assist with converting the expression
 * @private
 */
function _convertToDataExpr(line: AST_EXPR, manager: VariableManager): DataExprType {
	switch (line.type) {
		case "identName":
			return ['var', manager.add(line.value)];
		case "operation":
			switch (line.op.value) {
				case "cons":
					return [
						'cons',
						_convertToDataExpr(line.args[0], manager),
						_convertToDataExpr(line.args[1], manager),
					];
				case "hd":
				case "tl":
					return [
						line.op.value,
						_convertToDataExpr(line.args[0], manager),
					];
				case "true":
				case "false":
				default:
					throw new Error(`Unsupported feature '${line.type}'. Ensure the program is in pure WHILE.`);
			}
		case "tree":
			if (line.tree === null) return ['quote', 'nil'];
			throw new Error(`Unsupported feature '${line.type}'. Ensure the program is in pure WHILE.`);
		case "equal":
		case "list":
		case "macro":
		case "tree_expr":
			throw new Error(`Unsupported feature '${line.type}'. Ensure the program is in pure WHILE.`);
	}
}

/**
 * Convert a programs-as-data object to a program AST
 * @param data	The PaD object to convert
 * @param name	Te AST represented by the input object
 */
export function fromPad(data: ProgDataType, name: string = 'prog'): AST_PROG {
	//Create a variable manager to control the data
	let variableManager: VariableNamespaceManager = new VariableNamespaceManager();

	//Assign the input variable a name
	variableManager.addAnonymous(data[0]);

	//Convert each command in the program body to an AST
	let body: AST_CMD[] = [];
	for (let c of data[1]) body.push(_cmdFromPad(c, variableManager));

	//Create an AST_PROG object
	return {
		type: 'program',
		complete: true,
		//Program name
		name: {type: 'identName', value: name},
		//Input variable name
		input: {type: 'identName', value: variableManager.addAnonymous(data[0])},
		//Output variable name
		output: {type: 'identName', value: variableManager.addAnonymous(data[2])},
		//Program body
		body,
	}
}

/**
 * Convert a program-as-data command to an AST subtree
 * @param data		The pad command object
 * @param manager	Variable manager for reading/assigning variable names
 */
function _cmdFromPad(data: DataBodyType, manager: VariableNamespaceManager): AST_CMD {
	/*
	Create a stack to hold the commands/subcommands while converting from PAD
	At each point the stack contains the following:
	 [0] The data-list to convert to a command
	 [1] A list of AST commands, containing the so-far converted commands of this operation's body
	 		For assignment operations, this is empty.
	 		For loops, there are is one sublist (the loop body).
	 		For conditionals, there are two lists (if-body, else-body).
	 [2] The parent command's body list, into which this command should be placed
	*/
	const root: AST_CMD[] = [];
	const cmdStack: [DataBodyType, AST_CMD[][], AST_CMD[]][] = [
		[data, [], root]
	];

	while (cmdStack.length > 0) {
		//Read the top element of the stack
		let [data, cmds, parentCmds] = cmdStack.pop()!;

		switch (data[0]) {
			case ":=":
				//Directly place the assignment command into the parent's body
				parentCmds.push({
					type: 'assign',
					complete: true,
					ident: {type: 'identName', value: manager.addAnonymous(data[1])},
					arg: _exprFromPad(data[2], manager),
				})
				break;
			case "while":
				//Create a new body sublist to hold the body commands
				if (cmds.length === 0) cmds.push([]);
				if (cmds.length === 1 && cmds[0].length === data[2].length) {
					//The command has been fully converted
					//Add it to the end of parent's body
					parentCmds.push({
						type: 'loop',
						complete: true,
						condition: _exprFromPad(data[1], manager),
						body: cmds[0],
					});
				} else {
					//Push this command back onto the stack
					cmdStack.push([data, cmds, parentCmds]);
					//Push the next unconverted command from the body to the stack
					cmdStack.push([data[2][cmds[0].length], [], cmds[0]]);
				}
				break;
			case "if":
				//Add a new body list if one has not been created
				//Or if the first one has been filled
				if (cmds.length === 0) cmds.push([]);
				if (cmds.length === 1 && cmds[0].length === data[2].length) cmds.push([]);

				if (cmds.length === 2 && cmds[0].length === data[2].length && cmds[1].length === data[3].length) {
					//The if and else bodies have both been fully converted
					//Add this command to the end of parent's body
					parentCmds.push({
						type: 'cond',
						complete: true,
						condition: _exprFromPad(data[1], manager),
						if: cmds[0],
						else: cmds[1],
					});
				} else {
					//Push this command back onto the stack
					cmdStack.push([data, cmds, parentCmds]);
					if (cmds.length === 1) {
						//Push the next unconverted if-body command onto the stack
						cmdStack.push([data[2][cmds[0].length], [], cmds[0]]);
					} else if (cmds.length === 2) {
						//Push the next unconverted else-body command onto the stack
						cmdStack.push([data[3][cmds[1].length], [], cmds[1]]);
					}
				}
				break;
		}
	}

	//Return the produced command
	//This will be the only element of the `root` array
	return root[0];
}

/**
 * Convert a program-as-data expression to an AST subtree
 * @param data		The pad expression object
 * @param manager	Variable manager for reading/assigning variable names
 */
function _exprFromPad(data: DataExprType, manager: VariableNamespaceManager): AST_EXPR {
	/*
	Create a stack to hold the (sub)expressions while converting from PAD
	At each point the stack contains the following:
	 * The data-list to convert to an expression
	 * A list of AST expressions, containing the so-far converted elements of this operation
	 * The parent expression's expression list
	*/
	const root: AST_EXPR[] = [];
	const exprStack: [DataExprType, AST_EXPR[], AST_EXPR[]][] = [
		[data, [], root]
	];

	while (exprStack.length > 0) {
		//Read the top element of the stack
		let [data, expr, parent] = exprStack.pop()!;

		if (data[0] === "quote") {
			//Convert a 'nil' quoted value to a nil value
			if (data[1] !== 'nil') throw new Error(`Unsupported quote "${data[1]}", expected "nil"`);
			parent.push({
				type: 'tree',
				complete: true,
				tree: null,
			});
		} else if (data[0] === "var") {
			//Read the variable value
			parent.push({
				type: 'identName',
				//Get the variable's name from the number, or assign a name if it is not yet defined
				value: manager.addAnonymous(data[1]),
			});
		//From here, the data can only be an operation (cons/hd/tl)
		} else if (expr.length === 0) {
			//All operations need at least one expression as argument
			//Add the first argument in the list to the stack
			exprStack.push([data, expr, parent]);
			exprStack.push([data[1], [], expr]);
		} else if (data[0] === 'cons' && expr.length === 1) {
			//If the first argument of a 'cons' has been converted
			//Add the second one to the stack
			exprStack.push([data, expr, parent]);
			exprStack.push([data[2], [], expr]);
		} else {
			//If all the arguments are converted
			//Add them all to the parent operation's arg list
			parent.push({
				type: 'operation',
				complete: true,
				op: {type: 'opToken', value: data[0]},
				args: expr,
			});
		}
	}

	//Return the produced expression
	//This will be the only element of the `root` array
	return root[0];
}

/**
 * Display options for displaying prog-as-data objects.
 */
interface PadDisplayFormat {
	/**
	 * Text to display in place of 'assign' objects
	 */
	assign: string;
	/**
	 * Text to display in place of 'if' objects
	 */
	if: string;
	/**
	 * Text to display in place of 'while' objects
	 */
	while: string;
	/**
	 * Text to display in place of 'quote' objects
	 */
	quote: string;

	/**
	 * Text to display in place of 'cons' objects
	 */
	cons: string;
	/**
	 * Text to display in place of 'hd' objects
	 */
	hd: string;
	/**
	 * Text to display in place of 'tl' objects
	 */
	tl: string;
	/**
	 * Text to display in place of 'var' objects
	 */
	var: string;
}
/**
 * Predefined options for displaying PaD objects in a "pure" format
 */
export const PURE_DISPLAY_FORMAT: PadDisplayFormat = {
	assign: ':=',
	if: 'if',
	while: 'while',

	quote: 'quote',
	var: 'var',
	cons: 'cons',
	hd: 'hd',
	tl: 'tl',
};
/**
 * Predefined options for displaying PaD objects in the same format as HWhile
 */
export const HWHILE_DISPLAY_FORMAT: PadDisplayFormat = {
	assign: '@:=',
	if: '@if',
	while: '@while',

	quote: '@quote',
	var: '@var',
	cons: '@cons',
	hd: '@hd',
	tl: '@tl',
};

/**
 * Type definition for the commandStack used to convert prog-as-data objects
 */
interface StackObject {
	/**
	 * The prog-as-data object to evaluate at this point in the stack
	 */
	data: DataBodyType|DataExprType;
	/**
	 * The current "level" of iteration through this object.
	 * Used to differentiate between different arguments
	 */
	level: number;
	/**
	 * (Optional) terminating string to add after this object has been displayed
	 */
	terminator?: string;
}

/**
 * Produce a program string from the stored program AST
 * @param data		The program-as-data object to display
 * @param format	Formatting options to use to display the text
 * @param indent	The character(s) to use to indicate a single indent.
 * 					Defaults to 4 spaces.
 */
export function displayPad(data: ProgDataType, format: PadDisplayFormat, indent: string = '    '): string {
	//Make a builder to build up the output string
	let builder: StringBuilder = new StringBuilder({indent: indent});
	//Make a command stack to allow for iterative traversal through the pad tree
	const commandStack: StackObject[] = [];

	//Display the opening "[0, "
	builder.add(`[`).add(data[0]).add(', ');

	//Display the body opening paren, and add the body to the stack for evaluation
	_displayBody(data[1], commandStack, builder);
	//Evaluate the stack until complete
	_evalDisplayStack(commandStack, builder, format);
	//Display the body closing paren
	_displayBodyClose(data[1], builder);

	//Display the closing ", 1]"
	builder.add(`, `).add(data[2]).add(`]`);
	//Add a trailing new line
	builder.break();

	//Return the produced element as a string
	return builder.toString();
}

/**
 * Display the opening square bracket for a body block, indent the output, and add all the body's commands to the stack.
 * A trailing comma is added after each command, except the final one
 * @param data			The body to evaluate
 * @param commandStack	Command stack to use
 * @param builder		String builder to use
 */
function _displayBody(data: DataBodyType[], commandStack: StackObject[], builder: StringBuilder): void {
	//Open the body's bracket
	builder.add('[');
	if (data.length > 0) {
		//Only add a line break if the body is non-empty
		builder.break().indent();
		//Add the final element to the top of the stack
		commandStack.push({data: data[data.length - 1], level: 0});
		//Add the rest of the elements to the stack (in reverse order) with trailing commas
		for (let i = data.length - 2; i >= 0; i--) {
			commandStack.push({
				data: data[i],
				level: 0,
				terminator: ','
			});
		}
	}
}

/**
 * Display the closing bracket (and optionally dedent) to a code body.
 * @param data		The data object being closed
 * @param builder	String builder to use
 */
function _displayBodyClose(data: DataBodyType[], builder: StringBuilder): void {
	if (data.length > 0) builder.dedent();
	builder.add(`]`);
}

/**
 * Evaluate the {@code commandStack} object to render a programs-as-data object as a string
 * @param commandStack	The command stack to evaluate
 * @param builder		The
 * @param format		prog-as-data formatting options
 */
function _evalDisplayStack(commandStack: StackObject[], builder: StringBuilder, format: PadDisplayFormat): void {
	//Loop until the stack is empty
	while (commandStack.length > 0) {
		//Pop the element off the top of the stack
		let currLevel: StackObject = commandStack.pop()!;
		let data = currLevel.data;

		//Open the list's bracket if this is the first time the element is reached
		if (currLevel.level === 0) builder.add('[');
		//If the list has been completely displayed, end here
		if (currLevel.level >= data.length) {
			//Close the list's bracket
			builder.add(']');
			//Display the terminating symbols, if requested
			if (currLevel.terminator) builder.add(currLevel.terminator);
			//Add a terminating linebreak if the object is a command
			if (data[0] === ':=' || data[0] === 'if' || data[0] === 'while') builder.break();
			//Travel down the stack
			continue;
		}

		//The format of the rest of the elements is dependent on the type of element
		switch (data[0]) {
			case ":=":
				//Display ":=, 0, "
				builder.add(format.assign).add(', ').add(data[1]).add(', ');
				//Complete next time this is the top of the stack
				currLevel.level = 3;
				commandStack.push(currLevel);
				//Display the argument next
				commandStack.push({data:data[2], level: 0});
				break;
			case "while":
			case "if":
				if (currLevel.level === 0) {
					//Display "while, " or "if, "
					builder
						.add(data[0] === 'while' ? format.while : format.if)
						.add(', ');
					//Display the first body next time this is the top of the stack
					currLevel.level = 1;
					commandStack.push(currLevel);
					//Display the condition next
					commandStack.push({data:data[1], level: 0});
				} else if (currLevel.level === 1) {
					//Display a comma between the expression and body start
					builder.add(', ');
					//Perform the next step next time this is the top of the stack
					currLevel.level = 2;
					commandStack.push(currLevel);
					//Display the loop body (or if-true body) next
					_displayBody(data[2], commandStack, builder);
				} else if (data[0] === 'if' && currLevel.level === 2) {
					//Close the body list and add a training command
					_displayBodyClose(data[2], builder);
					builder.add(', ');
					//Close the body the next time this is the top of the stack
					currLevel.level = 3;
					commandStack.push(currLevel);
					//Display the else block
					_displayBody(data[3], commandStack, builder);
				} else {
					//Close the body list
					_displayBodyClose(data[2], builder);
					//Complete on the next iteration
					currLevel.level = 4;
					commandStack.push(currLevel);
				}
				break;
			case "var":
			case "quote":
				//Display "var, 0" or "quote, nil"
				builder
					.add(data[0] === 'var' ? format.var : format.quote)
					.add(', ').add(data[1]);
				//Complete on the next iteration
				currLevel.level = 2;
				commandStack.push(currLevel);
				break;
			case "cons":
				if (currLevel.level === 0) {
					//Display "cons, "
					builder.add(format.cons).add(', ');
					//Display the second argument the next time this is the top of the stack
					currLevel.level = 2;
					commandStack.push(currLevel);
					//Display the first argument on the next iteration
					commandStack.push({data:data[1], level: 0});
				} else {
					//Add a comma between the arguments
					builder.add(', ');
					//Complete next time this is the top of the stack
					currLevel.level = 3;
					commandStack.push(currLevel);
					//Display the second argument next iteration
					commandStack.push({data:data[2], level: 0});
				}
				break;
			case "hd":
			case "tl":
				//Display "hd, " or "tl, "
				builder
					.add(data[0] === 'hd' ? format.hd : format.tl)
					.add(', ');
				//Complete next time this is at the top of the stack
				currLevel.level = 2;
				commandStack.push(currLevel);
				//Display the argument on the next iteration
				commandStack.push({data:data[1], level: 0});
				break;
			default:
				throw new Error(`Unknown data type "${data[0]}"`);
		}
	}
}
