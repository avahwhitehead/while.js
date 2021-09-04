import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import { AST_PROG } from "../../src/types/ast";
import { parseProgram } from "../../src/linter";
import ProgramManager from "../../src/utils/ProgramManager";

chai.config.truncateThreshold = 0;

describe('ProgramManager', function () {
	describe('Variables', function () {
		it(`Empty prog`, function () {
			let prog = `
			prog read X {
				
			} write Y
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variableManager.variables).to.deep.equal(new Set(['X', 'Y']));
		});
		it(`Assigning`, function () {
			let prog = `
			prog read X {
				A := A;
				Y := X;
				X := Z
			} write Y
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variableManager.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
		it(`Loop/Cond`, function () {
			let prog = `
			prog read X {
				Y := X;
				while Y {
					if hd Y {
						Y := hd Y
					} else {
						Y := tl Y
					};
					Z := cons nil Z
				}
			} write Z
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variableManager.variables).to.deep.equal(new Set(['X', 'Y', 'Z']));
		});
		it(`Switch`, function () {
			let prog = `
			prog read X {
				switch X {
					case Y:
						A := nil
					case cons nil nil:
						A := cons nil nil
					case <nil.<Z.nil>>:
						A := cons nil cons nil nil
				}
			} write A
			`;
			let [ast,err] = parseProgram(prog);

			expect(err).to.deep.equal([]);
			expect(ast.complete).to.be.true;

			let mgr = new ProgramManager(ast as AST_PROG);

			expect(mgr.variableManager.variables).to.deep.equal(new Set(['A', 'X', 'Y', 'Z']));
		});
	});
});
