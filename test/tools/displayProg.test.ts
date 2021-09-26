import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { expectParseProgram } from "../utils";
import displayProgram from "../../src/tools/displayProg";

chai.config.truncateThreshold = 0;

describe('display program', function () {
	it(`should display an empty program`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
		} write X
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			``,
			`} write X`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	it(`should display a simple conditional program`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
			if X {
				Y := 1
			} else {
				Y := 0
			}
		} write Y
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			`    if X {`,
			`        Y := cons nil nil`,
			`    } else {`,
			`        Y := nil`,
			`    }`,
			`} write Y`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	it(`should hide empty else statements`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
			Y := 0;
			if X {
				Y := 1
			}
		} write Y
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			`    Y := nil;`,
			`    if X {`,
			// `        Y := <nil.nil>`,
			`        Y := cons nil nil`,
			`    }`,
			`} write Y`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	it(`should display numbers as trees`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
			Y := 0;
			Y := 1;
			Y := 2;
			Y := 3;
			Y := 4;
			Y := 5
		} write Y
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			`    Y := nil;`,
			`    Y := cons nil nil;`,
			`    Y := cons nil cons nil nil;`,
			`    Y := cons nil cons nil cons nil nil;`,
			`    Y := cons nil cons nil cons nil cons nil nil;`,
			`    Y := cons nil cons nil cons nil cons nil cons nil nil`,
			`} write Y`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	it(`should display loops`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
			Z := nil;
			while X {
				Y := hd X;
				X := tl X;
				if Y {
					Z := cons nil Z
				} else {}
			}
		} write Y
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			`    Z := nil;`,
			`    while X {`,
			`        Y := hd X;`,
			`        X := tl X;`,
			`        if Y {`,
			`            Z := cons nil Z`,
			`        }`,
			`    }`,
			`} write Y`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	it(`should display macros`, function () {
		//Get an AST
		let ast = expectParseProgram(`
		prog read X {
			while X {
				Y := <add> cons X Y
			}
		} write Y
		`);

		//Expected display representation
		let expected = [
			`prog read X {`,
			`    while X {`,
			`        Y := <add> cons X Y`,
			`    }`,
			`} write Y`
		].join('\n');

		//Expect this output
		expect(displayProgram(ast, '    ')).to.deep.equal(expected);
	});

	describe(`cons brackets`, function () {
		it(`should not display brackets around nil arguments`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons nil nil
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons nil nil`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});

		it(`should not display brackets around ident arguments`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons X Y
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons X Y`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});

		it(`should not display brackets around simple arguments`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons nil Y
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons nil Y`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});

		it(`should display brackets around complex arguments`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons cons X X cons Y Y
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons (cons X X) (cons Y Y)`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});

		it(`should only display brackets around complex arguments`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons cons X X Y
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons (cons X X) Y`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});

		it(`should display brackets in nested operations`, function () {
			//Get an AST
			let ast = expectParseProgram(`
			prog read X {
				Y := cons cons cons X X cons X X cons Y Y
			} write Y
			`);

			//Expected display representation
			let expected = [
				`prog read X {`,
				`    Y := cons (cons (cons X X) (cons X X)) (cons Y Y)`,
				`} write Y`
			].join('\n');

			//Expect this output
			expect(displayProgram(ast, '    ')).to.deep.equal(expected);
		});
	});
});
