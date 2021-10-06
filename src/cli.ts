#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { Command } from "commander";
import Interpreter, { InterpreterProps } from "./run/Interpreter";
import { BinaryTree } from "./types/Trees";
import treeConverter, { ConversionResultType, stringify, treeParser } from "@whide/tree-lang";
import { displayPad, ErrorType } from "./index";
import { parseProgram } from "./linter";
import { AST_PROG, AST_PROG_PARTIAL } from "./types/ast";
import { HWHILE_DISPLAY_FORMAT, ProgDataType, PURE_DISPLAY_FORMAT } from "./tools/progAsData";
import ProgramManager from "./utils/ProgramManager";
import MacroManager from "./utils/MacroManager";

/**
 * Util function to convert a binary tree (type {@link BinaryTree}) to a string.
 * If there is an error converting the tree, an "(E)" is added to the start of the output.
 * @param tree		The tree to convert
 * @param format	Tree conversion string to use to display the tree (see {@link stringify}).
 */
function treeToString(tree: BinaryTree, format: string = 'any') {
	let treeString: string;
	try {
		let res: ConversionResultType = treeConverter(tree, format);
		treeString = stringify(res.tree);
		if (res.error) treeString = '(E) ' + treeString;
	// @ts-ignore
	} catch (e: Error) {
		throw new Error(`Couldn't display variable: ${e.message}`);
	}
	return treeString;
}

function _readProgram(filePath: string, ignoreName: boolean = false): AST_PROG {
	//Check the file exists
	let fullPath = path.resolve(filePath);
	if (!fs.existsSync(fullPath)) {
		throw new Error(`Couldn't find file '${filePath}'`)
	}

	//Read the program from the file
	let content: string;
	try {
		content = fs.readFileSync(fullPath, 'utf8');
	} catch (e) {
		throw e;
	}

	let [ast, err]: [(AST_PROG|AST_PROG_PARTIAL),ErrorType[]] = parseProgram(content);
	if (err.length || !ast.complete) {
		throw new Error(
			`Errors while parsing ${filePath}:\n`
			+ err.map(e => `${e.position.col}.${e.position.row}: ${e.message}`).join('\n    ')
		);
	}

	if (!ignoreName) {
		//Make sure the program name matches the file
		let fileName: string = path.basename(filePath);
		fileName = fileName.split(/\./)[0];
		if (fileName !== ast.name.value) {
			console.error(`Error: File name should match program name.`);
			process.exit(1);
		}
	}

	return ast as AST_PROG;
}

/**
 * Function called by commander to run a program acting as an interpreter (rather than a debugger).
 * The code is executed from start to finish with no breaks.
 * @param ast		AST of the program to execute
 * @param tree		Binary tree to pass as input to the program
 * @param options	The options object produced by commander ({@link Command.opts}
 * @param macros	Macro programs to provide to the interpreter
 */
function _runInterpreter(ast: AST_PROG, tree: BinaryTree, options: InterpreterOptions, macros?: (AST_PROG|{n?: string, p: AST_PROG})[]) {
	//Create an interpreter from the program and input
	let interpreterOpts: InterpreterProps = {
		lexOpts: {pureOnly: options.pure},
		parseOpts: {pureOnly: options.pure},
		macros
	};
	let interpreter = new Interpreter(ast, tree, interpreterOpts);

	//Run the interpreter
	let output: BinaryTree = interpreter.run();
	//Convert the variable's value to a string
	let treeString = treeToString(output, options.output);
	//Output the produced value
	console.log(`Program finished\nWrote ${interpreter.ast.output.value}=${treeString}`);
}

/**
 * Type definition of the command line options read by commander.
 */
interface InterpreterOptions {
	/**
	 * Default variable output format.
	 */
	output: string;
	/**
	 * Whether to run as pure WHILE.
	 */
	pureOnly: boolean;
	/**
	 * Convert a program to pure WHILE
	 */
	ignoreName: boolean;
	/**
	 * Convert a program to pure WHILE
	 */
	pure: boolean;
	/**
	 * Convert a program to PaD representation
	 */
	data: boolean;
	/**
	 * Same as {@link this.data}
	 */
	u: boolean;
	/**
	 * Whether to display PaD conversion without @ symbols
	 */
	pureData: boolean;
}

const program = new Command();
program
	.description('Command line interface for the while.js interpreter.',)
	.option('-P, --pureOnly', 'run the program using pure WHILE syntax only (error on extended while)')
	.option('-o, --output <format>', 'interpreter tree output format')
	.option('--ignore-name', `don't error if the program name doesn't match the file name`)

	.option('-d, --data', `Convert a program into its programs-as-data format.`)
	.option('-u', 'Same as --data. Compatibility argument with HWhile.')
	.option('--pure-data', 'For use with -d. Display prog-as-data without the @.')

	.option('-p, --pure', `Convert a program to its pure WHILE equivalent.`)

	.argument('<file>', 'File containing the input WHILE program')
	.argument('[input]', 'Binary tree to use as input to the WHILE program')

	.action((filePath: string, input: string|undefined, opts: InterpreterOptions) => {
		//Create an AST of the program to execute
		//This will be required no matter which options are provided
		let ast: AST_PROG = _readProgram(filePath, opts.ignoreName);
		let progMgr: ProgramManager = new ProgramManager(ast);

		//Path of the folder containing the program file
		let parentDir = path.join(filePath, '..');

		//Get all the macros requested by any program
		let macroMgr: MacroManager = new MacroManager(ast);
		//Register all the macros
		macroMgr.autoRegister(
			(name: string) => _readProgram(path.join(parentDir, name + '.while'), opts.ignoreName)
		);

		if (opts.pure) {
			//Convert to pure WHILE
			progMgr.toPure(macroMgr.macros);
			//Display the result
			console.log(progMgr.displayProgram());
			return;
		} else if (opts.data || opts.u) {
			//Convert to prog-as-data
			let pad: ProgDataType = progMgr.toPad();
			//Display the result
			console.log(displayPad(
				pad,
				opts.pureData ? PURE_DISPLAY_FORMAT : HWHILE_DISPLAY_FORMAT
			));
			return;
		} else {
			//Run the input program with the interpreter
			if (input === undefined) {
				console.error(`Expected parameter 'input' to the interpreter`);
				process.exit(1);
				return;
			}
			//Attempt to parse the input tree string to an object
			let tree: BinaryTree;
			try {
				tree = treeParser(input);
			} catch (e) {
				throw e;
			}
			//Run the program from start to finish
			_runInterpreter(ast, tree, opts, macroMgr.macros);
		}
	});

program.addHelpText('before',
`See Whide TreeLang homepage (at the bottom of this message) for a description of the formatting language used to display trees. 
`);

program.addHelpText('after', `

Example calls:
  $ whilejs add.while <3.4>
  $ whilejs add.while <<nil.nil>.<nil.nil>>
  $ whilejs -o int add.while <3.4>
  $ whilejs --output int add.while <3.4>
  $ whilejs -o int add.while <3.4>
  $ whilejs -o (int|any)[] add.while <3.4>
`);

program.addHelpText('after', `
Useful links:
 * HWhile:                https://github.com/alexj136/hWhile
 * While.js Homepage:     https://github.com/sonrad10/while.js
 * Whide TreeLang:        https://github.com/sonrad10/whide-treeLang
 * Whide (WHILE IDE):     https://github.com/sonrad10/Whide
`);

//Parse the input parameters, and start the program
program.parse(process.argv);
