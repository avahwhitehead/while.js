import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { expectParseProgram } from "../utils";
import toPad, { ProgDataType } from "../../src/tools/progAsData";

chai.config.truncateThreshold = 0;

describe('Programs as Data', function () {
	describe('Basic conversion', function () {
		it(`should correctly convert variable values`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					Y := X
				} write Y
			`);

			//The expected PAD result
			let expected: ProgDataType = [0, [
				[':=', 1, ['var', 0]]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert nil`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					Y := nil
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['quote', 'nil']]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert hd`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					Y := hd X
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['hd', ['var', 0]]]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert tl`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					Y := tl X
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['tl', ['var', 0]]]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert if`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					if X {}
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				['if', ['var', 0], [], []]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert if-else`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					if X {} else {}
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				['if', ['var', 0], [], []]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`should correctly convert while`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				prog read X {
					while X { }
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				['while', ['var', 0], []]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});
	});

	describe('Program conversion', function () {
		it(`[Example program from LoC2]`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				p read X {
					Y := nil;
					while X {
						Y := cons hd X Y;
						X := tl X
					}
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['quote','nil']],
				['while', ['var',0], [
					[':=', 1, ['cons', ['hd', ['var', 0]], ['var', 1]]],
					[':=', 0, ['tl', ['var', 0]]]
				]]
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`add.while`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				add read XY {
					X := hd XY;
					Y := tl XY;
					while X {
						Y := cons nil Y;
						X := tl X
					}
				} write Y
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['hd', ['var', 0]]],
				[':=', 2, ['tl', ['var', 0]]],
				['while', ['var', 1], [
					[':=', 2, ['cons', ['quote', 'nil'], ['var', 2]]],
					[':=', 1, ['tl', ['var', 1]]]
				]]
			], 2];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`count.while`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				count read LIST {
					SUM := 0;
					while LIST {
						// Remove the head of the list and assign it to ELEM
						ELEM := hd LIST;
						LIST := tl LIST;
					
						// Add ELEM to SUM
						while ELEM {
							SUM := cons nil SUM;
							ELEM := tl ELEM
						}
					}
				} write SUM
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [
				[':=', 1, ['quote', 'nil']],
				['while', ['var', 0], [
					[':=', 2, ['hd', ['var', 0]]],
					[':=', 0, ['tl', ['var', 0]]],

					['while', ['var', 2], [
						[':=', 1, ['cons', ['quote', 'nil'], ['var', 1]]],
						[':=', 2, ['tl', ['var', 2]]],
					]],
				]],
			], 1];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});

		it(`identity.while`, function () {
			//Create a ProgramManager for the program
			let ast = expectParseProgram(`
				ident read X { } write X
			`);

			//The expected pure AST
			let expected: ProgDataType = [0, [], 0];

			//Expect the program-as-data result
			expect(toPad(ast)).to.deep.equal(expected);
		});
	});
});
