import { AST_ASGN, AST_CMD, AST_EXPR, AST_IDENT_NAME, AST_IF, AST_OP, AST_PROG, AST_WHILE } from "../types/ast";
import { OP_TOKEN_EXTD } from "../types/extendedTokens";

function _idnt(value: string): AST_IDENT_NAME {
	return {
		type: 'identName',
		value
	}
}

function _assign(ident: string, value: AST_EXPR|string): AST_ASGN {
	if (typeof value === 'string') value = _idnt(value);
	return {
		type: 'assign',
		complete: true,
		ident: _idnt(ident),
		arg: value,
	}
}

function _operation(op: OP_TOKEN_EXTD, ...args: (AST_EXPR|string)[]): AST_OP {
	args = args.map(v => (typeof v === 'string') ? _idnt(v) : v);
	return {
		type: 'operation',
		complete: true,
		op: {type: 'opToken', value: op},
		args: args as AST_EXPR[],
	}
}

function _while(cond: AST_EXPR, body: AST_CMD[]): AST_WHILE {
	return {
		type: 'loop',
		complete: true,
		condition: cond,
		body,
	}
}

function _if(cond: AST_EXPR, bodyIf: AST_CMD[], bodyElse: AST_CMD[] = []): AST_IF {
	return {
		type: 'cond',
		complete: true,
		condition: cond,
		if: bodyIf,
		else: bodyElse,
	}
}

const nil_token: AST_IDENT_NAME = _idnt('nil');
const false_token: AST_IDENT_NAME = nil_token;
const true_token: AST_OP = {
	type: 'operation',
	complete: true,
	op: { type:'opToken', value:'cons' },
	args: [nil_token, nil_token]
};

const EQUALS_PROG: AST_PROG = {
	type: 'program',
	complete: true,
	// equals
	name: _idnt('equals'),
	// read TS {
	input: _idnt('TS'),
	body: [
		// s := cons TS nil;
		_assign('s', _operation('cons', 'TS', nil_token)),
		
		// isEqual := true;
		_assign('isEqual', true_token),

		// while s {
		_while(_idnt('s'), [
			// t1 := hd hd s;
			_assign('t1', _operation('hd', _operation('hd', 's'))),
			// t2 := tl hd s;
			_assign('t2', _operation('tl', _operation('hd', 's'))),
			// s := tl s;
			_assign('s', _operation('tl', 's')),

			// if t1 {
			_if(_idnt('t1'), [
				// if t2 {
				_if(_idnt('t2'),
					[
						// s := cons (cons (tl t1) (tl t2)) s;
						_assign('s', _operation('cons', _operation('cons', _operation('tl', 't1'), _operation('tl', 't2')), 's')),
						// s := cons (cons (hd t1) (hd t2)) s;
						_assign('s', _operation('cons', _operation('cons', _operation('hd', 't1'), _operation('hd', 't2')), 's')),
					// } else {
					], [
						// isEqual := false
						_assign('isEqual', false_token),
						// s := nil
						_assign('s', nil_token)
					],
				// }
				),
			// } else {
			], [
				// if t2 {
				_if(_idnt('t2'), [
					// isEqual := false
					_assign('isEqual', false_token),
					// s := nil
					_assign('s', nil_token)
				// }
				])
			],
			//};
			),
	 	// }
		]),
	],
	// } write isEqual
	output: _idnt('isEqual'),
}
export default EQUALS_PROG;

/*
(*
Pure WHILE program to check the equality of two binary trees using depth-first traversal.
Input is of the form <T.S> where `T` and `S` are the two trees to compare.
Output is true (<nil.nil>) if the trees are equal, or false (nil) otherwise.

At the start of each iteration, each element of the stack 's' is two trees (<t1.t2>) which are in equivalent positions
in the two input trees.
Initially, the stack contains one element, which is the two input trees to the macro.

For each iteration, the trees held at the top of the stack are checked for equality.
If one is nil and the other is not, the loop exits and returns that the trees are not equal.
If they are both non-nil, each tree's right-node is added to the stack, then each tree's left-node.
This results in a depth-first traversal of the nodes in the trees, travelling down the leftmost path first,
then working back up until the rightmost node is reached.
*)

myequals read TS {
    //Initialise a stack to hold the two input trees to compare
    s := cons TS nil;

	//Hold whether or not a difference has been found in the trees
    isEqual := true;

    //Loop for as long as there are untraversed nodes in the trees
    while s {
    	//Pop the next subtrees to compare from the stack
        t1 := hd hd s;
        t2 := tl hd s;
        s := tl s;

        if t1 {
            if t2 {
            	// t1 and t2 are both not nil

                // Add the right-side subtrees to the stack
                s := cons (cons (tl t1) (tl t2)) s;
                // Add the left-side subtrees to the stack
                s := cons (cons (hd t1) (hd t2)) s;
            } else {
            	//t2 is nil and t1 is not
            	//Mark the trees as different and stop looping
                isEqual := false;
            	s := nil
            }
        } else {
            if t2 {
            	//t1 is nil and t2 is not
            	//Mark the trees as different and stop looping
                isEqual := false;
            	s := nil
            }
            //Otherwise subtrees are both nil
        }
    }
} write isEqual
*/