#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { Command } from "commander";
import Interpreter from "./run/Interpreter";
import { BinaryTree } from "./types/Trees";
import treeConverter, { ConversionResultType, stringify, treeParser } from "@whide/tree-lang";

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

/**
 * Function called by commander to run a program acting as an interpreter (rather than a debugger).
 * The code is executed from start to finish with no breaks.
 * @param filePath	Path to the file to execute
 * @param tree		Binary tree to pass as input to the program
 * @param options	The options object produced by commander ({@link Command.opts}
 */
function _runInterpreter(filePath: string, tree: BinaryTree, options: InterpreterOptions) {
	//Read the program from the file
	let program: string;
	try {
		program = fs.readFileSync(filePath, 'utf8');
	} catch (e) {
		console.error(e);
		return;
	}

	//Attempt to create an interpreter from the program and input
	let res = Interpreter.parse(program, tree);
	if (res.success) {
		//Run the interpreter
		let output: BinaryTree = res.interpreter.run();
		//Convert the variable's value to a string
		let treeString = treeToString(output, options.output);
		//Output the produced value
		console.log(`Program finished\nWrote ${res.interpreter.ast.output.value}=${treeString}`);
	} else {
		for (let err of res.errors) {
			console.error(`Error at ${err.position.row}:${err.position.col}: ${err.message}`);
		}
	}
}

/**
 * Type definition of the command line options read by commander.
 */
interface InterpreterOptions {
	/**
	 * Default variable output format.
	 */
	output: string;
}

//Set up the command line interface options
const program = new Command();
program
	.description(
		'Command line interface for the while.js interpreter and debugger.',
		{
			 'file': 'File containing the WHILE program to run',
			 'input': 'Binary tree to pass as input to the WHILE program',
		}
	)
	.option('-o, --output <format>', 'default tree output format')
	.arguments('<file> <input>')
	.action((file: string, input: string) => {
		//Get the user's input options
		const options: InterpreterOptions = program.opts() as InterpreterOptions;

		//Check the file exists
		let fullPath = path.resolve(file);
		if (!fs.existsSync(fullPath)) {
			console.error(`Error: Couldn't find file '${file}'`)
			return;
		}

		//Attempt to parse the input tree string to an object
		let tree: BinaryTree;
		try {
			tree = treeParser(input);
		} catch (e) {
			console.error(`Error parsing input tree: ${e}`);
			return;
		}

		//Run the program from start to finish
		_runInterpreter(file, tree, options);
	});

program.addHelpText('before', `
See https://github.com/sonrad10/whide-treeLang for a description of the formatting language used to display trees. 
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

//Parse the input parameters, and start the program
program.parse(process.argv);
