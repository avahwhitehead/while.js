import { AST_PROG } from "../types/ast";
import ProgramManager from "./ProgramManager";

/**
 * Pair of macro names to program ASTs
 */
export type MacroDescriptor = {
	n: string,
	p: AST_PROG
};

/**
 * Manager class to simplify the loading of macro programs.
 * Automatically detects macro calls from programs and detects whether macros have already been registered.
 */
export default class MacroManager {
	private readonly _unregistered: Set<string>;
	private readonly _macroMap: Map<string, MacroDescriptor>;
	private _iterator: IterableIterator<string>|undefined;

	public constructor(prog?: AST_PROG, name?: string) {
		this._unregistered = new Set<string>();
		this._macroMap = new Map<string, {n: string; p: AST_PROG}>();
		if (prog) this.register(prog, name);
	}

	/**
	 * Register a macro name and AST, automatically detecting any macros registered by those programs.
	 * @param prog	The AST of the macro
	 * @param name	(Optional) Explicit name to use for the macro.
	 * 				If not provided, the program's name is used.
	 */
	public register(prog: AST_PROG, name?: string): void {
		//Use the program name if an explicit name is not defined
		if (!name) name = prog.name.value;
		//Add the macro to the save list
		this._macroMap.set(name, {
			n: name,
			p: prog
		});
		this._unregistered.delete(name);
		//Get all the macros referenced by this program
		let mgr = new ProgramManager(prog);
		for (let macroName of mgr.macros) {
			//Save the macro to the unregistered list if it has not been registered already
			if (!this._macroMap.has(macroName)) {
				this._unregistered.add(macroName);
			}
		}
	}

	/**
	 * Names of all the macros stored in the manager.
	 */
	public get macroNames(): IterableIterator<string> {
		return this._macroMap.keys();
	}

	/**
	 * Name/AST pairs of all the registered macros in this manager.
	 */
	public get macros(): MacroDescriptor[] {
		return Array.from(this._macroMap.values());
	}

	/**
	 * Names of all the detected macros which don't have an assigned AST
	 */
	public get unregisteredMacros(): string[] {
		return Array.from(this._unregistered);
	}

	/**
	 * Returns {@code true} if there are any macros which don't have an associated AST.
	 */
	public get hasUnregistered(): boolean {
		return this._unregistered.size > 0;
	}

	/**
	 * Get the name of the next macro that has not yet been registered.
	 * @returns {string}	The next name of a macro that needs to be registered.
	 * @returns {null}		If all the macros have been registered.
	 */
	public getNextUnregistered(): string|null {
		let next: IteratorYieldResult<string>|IteratorReturnResult<any>;
		while (true) {
			//Make sure there is an iterator of the unregistered macros
			if (this._unregistered.size === 0) return null;
			if (!this._iterator) this._iterator = this._unregistered.values();

			//Get the next unregistered name from the iterator
			next = this._iterator.next();
			//Remove the iterator if it has finished
			if (next.done) this._iterator = undefined;
			//Check if the macro has been registered
			if (!this._macroMap.has(next.value)) return next.value;
		}
	}

	/**
	 * Use a callback to automatically load and register macro programs until all are loaded.
	 * @param cbk	Callback function to load a macro program given the macro name.
	 * 				Input parameter is the macro name.
	 * 				Return value is an {@link AST_PROG}	object, or an {@link MacroDescriptor} object specifying a name.
	 */
	public autoRegister(cbk: (macro: string) => AST_PROG): void {
		//Run until all macros are registered
		while (this.hasUnregistered) {
			//Get the next referenced macro
			let macroName = this.getNextUnregistered()!;
			//Use the callback to load the macro
			let res: AST_PROG = cbk(macroName);
			//Register
			this.register(res, macroName);
		}
	}
}