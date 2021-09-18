import { VariableManager } from "../utils/VariableManager";
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