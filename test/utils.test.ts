import { describe, it } from "mocha";
import { expect } from "chai";
import { a, t, tn } from "./utils";

describe('Utils tests', function () {
	describe(`#a - array of values`, function () {
		it('should produce an empty tree', function () {
			expect(a(
				...[1, 2, 3]
			)).to.eql({
				left: tn(1),
				right: {
					left: tn(2),
					right: {
						left: tn(3),
						right: null,
					},
				},
			});
		});
		it('should produce an empty tree', function () {
			expect(a(
				...[null, null, null]
			)).to.eql(
				tn(3)
			);
		});
		it('should produce an empty tree', function () {
			expect(a(
				null
			)).to.eql(
				tn(1)
			);
		});
		it('should produce an empty tree', function () {
			expect(a()).to.eql(
				null
			);
		});
	});

	describe(`#t - shorthand tree creation`, function () {
		it('(null,null) => <nil.nil>', function () {
			expect(
				t(null, null)
			).to.eql({
				left: null,
				right: null,
			});
		});
		it('((null,null),(null,null)) => <<nil.nil>.<nil.nil>>', function () {
			expect(
				t(t(null, null), t(null, null))
			).to.eql({
				left: {
					left: null,
					right: null,
				},
				right: {
					left: null,
					right: null,
				},
			});
		});
		it('((null,(null,null)),((null,null),null)) => <<nil.<nil.nil>>.<<nil.nil>.nil>>', function () {
			expect(
				t(t(null, t(null, null)), t(t(null, null), null))
			).to.eql({
				left: {
					left: null,
					right: {
						left: null,
						right: null,
					},
				},
				right: {
					left: {
						left: null,
						right: null,
					},
					right: null,
				},
			});
		});
	});

	describe(`#tn - numbers to trees`, function () {
		it('0', function () {
			expect(
				tn(0)
			).to.eql(
				null
			);
		});
		it('1', function () {
			expect(
				tn(1)
			).to.eql({
				left: null,
				right: null,
			});
		});
		it('5', function () {
			expect(
				tn(5),
			).to.eql({
				left: null,
				right: {
					left: null,
					right: {
						left: null,
						right: {
							left: null,
							right: {
								left: null,
								right: null,
							},
						},
					},
				},
			});
		});
	});
});