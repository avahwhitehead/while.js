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
 * Use {@link VariableManager.add} to create new variable name mappings,
 * and {@link VariableManager.get} to read existing ones.
 *
 * Namespaces are used to allow merging multiple programs where variable names may overlap.
 * Simply pass a string unique to each program to define groups of variable names.
 *
 * NOTE: Namespaces must be unique to EACH OCCURRENCE of a program merge.
 * This means the same program being merged twice in the same parent program MUST HAVE DIFFERENT NAMESPACES.
 * Duplicate namespaces carry the risk of overlapping variable names, and causing unexpected program results.
 * You may use {@link VariableManager.getNewNamespace} to generate unique namespace names.
 * The default namespace name is stored in {@link VariableManager.DEFAULT_NS}; passing this as a namespace parameter is
 * treated the same as passing {@code undefined} in its place
 */
export default class VariableManager {
	public static readonly DEFAULT_NS: string = 'default';

	// Map of Namespace => (oldName => newName)
	private readonly _variableMap: Map<string, Map<string, string>>;
	// Map of newName => [oldName, namespace]
	private readonly _variableLookup: Map<string, [string, string]>;
	private _varNameGenerator: NameGenerator;
	private _namespaceGenerator: NameGenerator;

	/**
	 * @param opts		Constructor options
	 */
	constructor(opts?: VariableManagerProps) {
		this._variableMap = new Map<string, Map<string, string>>();
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
	public add(name: string, namespace: string|undefined = VariableManager.DEFAULT_NS, newName?: string, force = false): string {
		namespace = namespace || VariableManager.DEFAULT_NS;

		//Create a new name if one is not defined
		if (newName === undefined) {
			newName = this.getNextVarName();
		}

		//Get the namespace's variable map
		let variables = this._variableMap.get(namespace);
		if (!variables) this._variableMap.set(namespace, (variables = new Map()));

		//Return the new name if it has already been set
		//Unless setting the new value is forced
		if (variables.has(name)) {
			if (!force) return variables.get(name)!;

			this._variableLookup.delete(variables.get(name)!);
			variables.delete(name);
		}

		//Assign the variable's new name
		variables.set(name, newName);
		this._variableLookup.set(newName, [name, namespace])
		//Return the variable's name
		return newName;
	}

	/**
	 * Get the new name of a variable from it's namespace and old name
	 * @param name			The variable's old name
	 * @param namespace		(Optional) The namespace in which to look for the variable.
	 * 						Default is {@code "default"}.
	 * @returns {string}	The new name of the variable, if defined
	 * @returns {undefined}	If the variable has not been assigned a name
	 */
	public get(name: string, namespace: string|undefined = VariableManager.DEFAULT_NS): string|undefined {
		return this._variableMap.get(namespace || VariableManager.DEFAULT_NS)?.get(name);
	}

	/**
	 * Delete a variable from its namespace
	 * @param name			The variable's old/current name
	 * @param namespace		(Optional) The namespace from which to delete the variable.
	 * 						Default is {@link VariableManager.DEFAULT_NS}.
	 */
	public delete(name: string, namespace: string|undefined = VariableManager.DEFAULT_NS): void {
		let variables: Map<string, string>|undefined = this._variableMap.get(namespace);
		if (!variables) return;
		this._variableLookup.delete(variables.get(name)!);
		variables.delete(name);
	}

	/**
	 * Remove a namespace and all the variables contained in it.
	 * @param namespace		(Optional) The namespace to remove.
	 * 						Default is {@link VariableManager.DEFAULT_NS}.
	 */
	public deleteNamespace(namespace: string|undefined = VariableManager.DEFAULT_NS): void {
		for (let v of this._variableMap.get(namespace)?.keys() || []) {
			this.delete(v, namespace);
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
	public exists(name: string, namespace: string|undefined = VariableManager.DEFAULT_NS): boolean {
		return this.get(name, namespace || VariableManager.DEFAULT_NS) !== undefined;
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
