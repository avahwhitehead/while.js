import VariableNamespaceManager, { VariableManager } from "../utils/VariableManager";
import { AST_CMD, AST_EXPR, AST_PROG } from "../types/ast";

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
