import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import NameGenerator from "../../src/utils/NameGenerator";

chai.config.truncateThreshold = 0;

describe('Name Generator', function () {
	describe('Sequential', function () {
		it(`Should produce A-Z`, function () {
			let generator = new NameGenerator();
			let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			for (let i = 0; i < chars.length; i++) {
				expect(generator.next()).to.equal(chars.charAt(i));
			}
		});
		it(`Should loop back to AA`, function () {
			let generator = new NameGenerator();

			for (let i = 0; i < 25; i++) generator.next();

			expect(generator.next()).to.equal('Z');
			expect(generator.next()).to.equal('AA');
		});
		it(`Should start at different lengths if requested`, function () {
			//Test starting at different positive lengths
			for (let length = 1; length <= 5; length++) {
				let generator = new NameGenerator(length);
				expect(generator.next()).to.equal('A'.repeat(length));
			}

			//0 or below should start from 1
			let generator = new NameGenerator(0);
			expect(generator.next()).to.equal('A');

			generator = new NameGenerator(-1);
			expect(generator.next()).to.equal('A');

			generator = new NameGenerator(-2);
			expect(generator.next()).to.equal('A');
		});
		it(`Should overflow correctly`, function () {
			let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			//Start from AA because before this is tested elsewhere
			let generator = new NameGenerator(2);

			//Test AA - ZZ
			for (let i = 0; i < chars.length; i++) {
				let first = chars.charAt(i);
				for (let j = 0; j < chars.length; j++) {
					expect(generator.next()).to.equal(first + chars.charAt(j));
				}
			}

			//Test AAA - ZZZ
			for (let i = 0; i < chars.length; i++) {
				let first = chars.charAt(i);
				for (let j = 0; j < chars.length; j++) {
					let second = chars.charAt(j);
					for (let k = 0; k < chars.length; k++) {
						expect(generator.next()).to.equal(first + second + chars.charAt(k));
					}
				}
			}

			//Check that it overflows correctly
			expect(generator.next()).to.equal('AAAA');
			expect(generator.next()).to.equal('AAAB');
			expect(generator.next()).to.equal('AAAC');
		});
	});
});
