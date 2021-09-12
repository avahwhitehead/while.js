import * as chai from "chai";
import { expect } from "chai";
import { describe, it } from "mocha";
import VariableManager from "../../src/utils/VariableManager";

chai.config.truncateThreshold = 0;

describe('VariableManager', function () {
	it(`Default`, function () {
		let manager: VariableManager = new VariableManager();

		//Add a variable to the manager
		manager.add('myvar', undefined, 'myvar');
		manager.add('secondvar', 'default', 'renamed');

		//Check that the values are saved
		expect(manager.get('myvar')).to.equal('myvar');
		expect(manager.get('secondvar')).to.equal('renamed');

		//New values should not overwrite old values by default
		manager.add('myvar', undefined, 'newname');
		expect(manager.get('myvar')).to.equal('myvar');

		//New values should overwrite old values if forced
		manager.add('myvar', undefined, 'newname', true);
		expect(manager.get('myvar')).to.equal('newname');

		//Check that the new variable names appear in the variables list
		expect(manager.variables).to.deep.equal(new Set(['renamed', 'newname']));
	});

	it(`Namespaces`, function () {
		let manager: VariableManager = new VariableManager();

		//Add a variable to the manager
		manager.add('myvar', 'default', 'var1');
		manager.add('myvar', 'second', 'var2');

		//Check that the values are saved
		expect(manager.get('myvar')).to.equal('var1');
		expect(manager.get('myvar', 'second')).to.equal('var2');

		//Check that the new variable names appear in the variables list
		expect(manager.variables).to.deep.equal(new Set(['var1', 'var2']));
	});

	it(`Variable Lookup`, function () {
		let mgr: VariableManager = new VariableManager();

		//Add a variable to the manager
		mgr.add('myvar', 'first');		//A
		mgr.add('myvar', 'second');		//B
		mgr.add('A', 'first');			//C
		mgr.add('B', 'second');			//D

		//Check that the new variable names appear in the variables list
		expect(mgr.variables).to.deep.equal(new Set(['A', 'B', 'C', 'D']));

		//Lookup the variable's original name and namespace from its new name
		expect(mgr.lookupVariable('A')).to.deep.equal(['myvar', 'first']);
		expect(mgr.lookupVariable('B')).to.deep.equal(['myvar', 'second']);
		expect(mgr.lookupVariable('C')).to.deep.equal(['A', 'first']);
		expect(mgr.lookupVariable('D')).to.deep.equal(['B', 'second']);
	});

	it(`Long Variable Lookup`, function () {
		let mgr: VariableManager = new VariableManager({ minVarLen: 2});

		//Add a variable to the manager
		mgr.add('myvar', 'first');		//AA
		mgr.add('myvar', 'second');		//AB
		mgr.add('AA', 'first');			//AC
		mgr.add('AB', 'second');		//AD

		//Check that the new variable names appear in the variables list
		expect(mgr.variables).to.deep.equal(new Set(['AA', 'AB', 'AC', 'AD']));

		//Lookup the variable's original name and namespace from its new name
		expect(mgr.lookupVariable('AA')).to.deep.equal(['myvar', 'first']);
		expect(mgr.lookupVariable('AB')).to.deep.equal(['myvar', 'second']);
		expect(mgr.lookupVariable('AC')).to.deep.equal(['AA', 'first']);
		expect(mgr.lookupVariable('AD')).to.deep.equal(['AB', 'second']);
	});
});
