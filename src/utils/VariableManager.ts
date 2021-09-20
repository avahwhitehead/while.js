import NameGenerator from "./NameGenerator";

/**
 * Initialisation options for {@link VariableManager} objects
 */
export interface VariableManagerProps {
	/**
	 * Minimum length for new variable names
	 */
	minVarLen?: number;
}

/**
 * Handle the renaming of variables.
 * Use {@link VariableNamespaceManager.add} to create new variable name/value mappings,
 * and {@link VariableNamespaceManager.name} or {@link VariableNamespaceManager.index} to read existing ones.
 *
 * Namespaces are used to allow merging multiple programs where variable names may overlap.
 * Simply pass a string unique to each program to define groups of variable names.
 *
 * NOTE: Namespaces must be unique to EACH OCCURRENCE of a program merge.
 * This means the same program being merged twice in the same parent program MUST HAVE DIFFERENT NAMESPACES.
 * Duplicate namespaces carry the risk of overlapping variable names, and causing unexpected program results.
 * You may use {@link VariableNamespaceManager.getNewNamespace} to generate unique namespace names.
 * The default namespace name is stored in {@link VariableNamespaceManager.DEFAULT_NS}; passing this as a namespace parameter is
 * treated the same as passing {@code undefined} in its place
 */
export default class VariableNamespaceManager {
	public static readonly DEFAULT_NS: string = 'default';

	// Map of Namespace => (oldName => newName)
	private readonly _variableMap: Map<string, VariableManager>;
	// Map of newName => [oldName, namespace]
	private readonly _variableLookup: Map<string, [string, string]>;
	private _varNameGenerator: NameGenerator;
	private _namespaceGenerator: NameGenerator;

	/**
	 * @param opts		Constructor options
	 */
	constructor(opts?: VariableManagerProps) {
		this._variableMap = new Map<string, VariableManager>();
		this._variableLookup = new Map<string, [string, string]>();
		this._varNameGenerator = new NameGenerator(opts?.minVarLen);
		this._namespaceGenerator = new NameGenerator();
	}

	/**
	 * Add a variable to the manager, optionally renaming it to avoid overwriting existing variables.
	 *
	 * @param name			The existing name of the variable to add
	 * 						New unique name will be assigned automatically if not provided.
	 * @param namespace		(Optional) The namespace to add this variable under.
	 * 						Default is {@code "default"}.
	 * @param newName		(Optional) The new name to assign to this variable.
	 * 						If not provided, a new unique name will be generated
	 * @param force			Force overwriting a variable if the old name already exists in the store..
	 * @return {string}	The variable's new name.
	 * 					The stored name when the variable exists in the store,
	 * 					{@code newName} if provided, or a new name otherwise otherwise.
	 */
	public add(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS, newName?: string, force = false): string {
		namespace = namespace || VariableNamespaceManager.DEFAULT_NS;

		//Create a new name if one is not defined
		if (newName === undefined) {
			newName = this.getNextVarName();
		}

		//Get the namespace's variable map
		let variables = this._variableMap.get(namespace);
		if (!variables) this._variableMap.set(namespace, (variables = new VariableManager()));

		//Return the new name if it has already been set
		//Unless setting the new value is forced
		if (variables.exists(name)) {
			if (!force) return variables.name(name)!;

			this._variableLookup.delete(variables.name(name));
			variables.remove(name);
		}

		//Assign and return the variable's new name
		variables.add(name, newName);
		this._variableLookup.set(newName, [name, namespace])
		return newName;
	}

	/**
	 * Add a variable to the manager, and automatically assign it a name
	 * @param val		Numerical value representing the variable
	 * @param namespace	(Optional) Namespace to add the variable to.
	 * 					Defaults to {@link VariableNamespaceManager.DEFAULT_NS}
	 */
	public addAnonymous(val: number, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): string {
		namespace = namespace || VariableNamespaceManager.DEFAULT_NS;

		let variables = this._variableMap.get(namespace);
		if (!variables) this._variableMap.set(namespace, (variables = new VariableManager()));

		if (variables.exists(val)) return variables.name(val);

		let name = this.getNextVarName();
		this.add(name, namespace, name);
		return name;
	}

	/**
	 * Get the new name of a variable from it's namespace and old name.
	 * @deprecated	Use {@link name} instead
	 * @param name			The variable's old name
	 * @param namespace		(Optional) The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {string}	The new name of the variable, if defined
	 * @returns {undefined}	If the variable has not been assigned a name
	 */
	public get(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): string|undefined {
		return this.name(name, namespace)
	}

	/**
	 * Get the new name of a variable from it's namespace and old name.
	 * @param name			The variable's old name
	 * @param namespace		(Optional) The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {string}	The new name of the variable, if defined
	 * @returns {undefined}	If the variable has not been assigned a name
	 */
	public name(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): string|undefined {
		return this._variableMap.get(namespace || VariableNamespaceManager.DEFAULT_NS)?.name(name);
	}

	/**
	 * Get the numerical value of a variable from it's namespace and old name.
	 * @param name			The variable's old name
	 * @param namespace		(Optional) The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {string}	The new name of the variable, if defined
	 * @returns {undefined}	If the variable has not been assigned a name
	 */
	public index(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): number|undefined {
		return this._variableMap.get(namespace || VariableNamespaceManager.DEFAULT_NS)?.index(name);
	}

	/**
	 * Delete a variable from its namespace
	 * @param name			The variable's old/current name
	 * @param namespace		(Optional) The namespace from which to delete the variable.
	 * 						Default is {@link VariableManager.DEFAULT_NS}.
	 */
	public delete(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): void {
		let variables: VariableManager|undefined = this._variableMap.get(namespace || VariableNamespaceManager.DEFAULT_NS);
		if (!variables) return;
		this._variableLookup.delete(variables.name(name));
		variables.remove(name);
	}

	/**
	 * Remove a namespace and all the variables contained in it.
	 * @param namespace		(Optional) The namespace to remove.
	 * 						Default is {@link VariableManager.DEFAULT_NS}.
	 */
	public deleteNamespace(namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): void {
		let mgr = this._variableMap.get(namespace || VariableNamespaceManager.DEFAULT_NS);
		for (let v of mgr?.variables || []) {
			mgr!.remove(v[0]);
		}
		this._variableMap.delete(namespace);
	}

	/**
	 * Check whether the variable name exists in the map under a given namespace.
	 * @param name			The name of the variable to check
	 * @param namespace		(Optional) The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {true}	If the variable exists in the given namespace
	 * @returns {false}	Otherwise
	 */
	public exists(name: string, namespace: string|undefined = VariableNamespaceManager.DEFAULT_NS): boolean {
		return this.name(name, namespace || VariableNamespaceManager.DEFAULT_NS) !== undefined;
	}

	/**
	 * Check whether the namespace exists in the map.
	 * @param namespace		The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {true}	If the variable exists in the given namespace
	 * @returns {false}	Otherwise
	 */
	public namespaceExists(namespace: string): boolean {
		return this._variableMap.has(namespace);
	}

	/**
	 * Collection of all the new variable names in the program.
	 */
	public get variables(): Set<string> {
		return new Set<string>(this._variableLookup.keys());
	}

	/**
	 * Lookup a variable's namespace and original name from its new name.
	 * @returns {[string, string]}	The variable's old name and namespace, respectively.
	 * @returns {undefined}	If the variable name has not been assigned
	 */
	public lookupVariable(name: string): [string, string]|undefined {
		return this._variableLookup.get(name);
	}

	/**
	 * Collection of all the namespaces which have been defined in the program.
	 */
	public get namespaces(): Iterable<string> {
		return this._variableMap.keys();
	}

	/**
	 * Get a name for a new namespace which won't overlap with any existing ones.
	 */
	public getNewNamespace(): string {
		let name: string;
		do {
			name = this._varNameGenerator.next();
		} while (this._variableLookup.has(name));
		return name;
	}

	/**
	 * Get the next variable name which has not already been used by the program.
	 */
	public getNextVarName(): string {
		let name: string;
		do {
			name = this._varNameGenerator.next();
		} while (this._variableLookup.has(name));
		return name;
	}
}

/**
 * Class to convert variables to numerical equivalents
 */
export class VariableManager {
	private _ptr: number;
	private readonly _variables: string[];
	private readonly _names: string[];

	public constructor() {
		this._variables = [];
		this._names = [];
		this._ptr = 0;
	}

	/**
	 * Assign a variable to a value.
	 * @param variable	The name of the variable
	 * @param name		(Optional) New name to assign to the variable.
	 * 					Defaults to the variable's current name
	 * @param val		(Optional) Value to assign to the variable.
	 * 					Defaults to the next available value
	 */
	public add(variable: string, name?: string, val?: number): number {
		name = name || variable;
		if (val !== undefined) {
			this._variables.splice(val, 0, variable);
			this._names.splice(val, 0, name);
			return val;
		} else if (!this.exists(variable)) {
			let i = this._ptr++;
			this._variables.splice(i, 0, variable);
			this._names.splice(i, 0, name);
			return i;
		}
		return this.index(variable);
	}

	/**
	 * Unlink a variable from its value
	 * @param variable	The variable to unlink
	 */
	public remove(variable: string|number): this {
		let index: number;
		if (typeof variable === 'number') index = variable;
		else index = this.index(variable);

		if (index > -1) {
			this._variables.splice(index, 1);
			this._names.splice(index, 1);
		}
		return this;
	}

	/**
	 * Whether or not a variable exists
	 * @param variable	The variable name
	 */
	public exists(variable: string|number): boolean {
		if (typeof variable === 'number') return this._variables[variable] !== undefined;
		return this.index(variable) > -1;
	}

	/**
	 * Get the index (numerical) value of a variable
	 * @param variable	The variable name
	 */
	public index(variable: string): number {
		return this._variables.indexOf(variable);
	}

	/**
	 * Get the index (numerical) value of a variable
	 * @param variable	The variable name
	 */
	public name(variable: string|number): string {
		let index: number;
		if (typeof variable === 'number') index = variable;
		else index = this._variables.indexOf(variable);
		return this._names[index];
	}

	/**
	 * List of all the variables, in order
	 */
	get variables(): [string,string][] {
		return this._names.map((v,i) => [v, this._names[i]]);
		// return this._variables.map((v,i) => [v, this._names[i]]);
	}
}