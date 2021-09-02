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

//TODO: Put the fully commented WHILE code in this file as a comment

const EQUALS_PROG: AST_PROG = {
	type: 'program',
	complete: true,
	// equals
	name: _idnt('equals'),
	// read TS {
	input: _idnt('TS'),
	body: [
		// t1 := hd TS;
		_assign('t1',
			_operation('hd', 'TS')
		),
		// t2 := tl TS;
		_assign('t2',
			_operation('tl', 'TS')
		),

		// s1 := cons t1 nil;
		_assign('s1',
			_operation('cons', 't1', nil_token)
		),
		// s2 := cons t2 nil;
		_assign('s2',
			_operation('cons', 't2', nil_token)
		),
		
		// isEqual := true;
		_assign('isEqual', true_token),

		// loop := s1;
		_assign('loop', _operation('cons', nil_token, nil_token)),

		// while loop {
		_while(_idnt('loop'), [
			// t1 := hd s1;
			_assign('t1', _operation('hd', 's1')),
			// s1 := tl s1;
			_assign('s1', _operation('tl', 's1')),
			// t2 := hd s2;
			_assign('t2', _operation('hd', 's2')),
			// s2 := tl s2;
			_assign('s2', _operation('tl', 's2')),

			// if t1 {
			_if(_idnt('t1'),
				[
					// if (t2) {
					_if(_idnt('t2'),
						[
							// s1 := cons (hd t1) s1;
							_assign('s1', _operation('cons', _operation('hd', 't1'), 's1')),
							// s1 := cons (tl t1) s1;
							_assign('s1', _operation('cons', _operation('tl', 't1'), 's1')),
							// s2 := cons (hd t2) s2;
							_assign('s2', _operation('cons', _operation('hd', 't2'), 's2')),
							// s2 := cons (tl t2) s2
							_assign('s2', _operation('cons', _operation('tl', 't2'), 's2'))
						],
						// } else {
						[
							// isEqual := false
							_assign('isEqual', false_token)
						],
					// }
					),
				// } else {
				], [
					// if t2 {
					_if(_idnt('t2'), [
						// isEqual := false
						_assign('isEqual', false_token)
					// }
					])
				],
			//};
			),

			// if isEqual {
			_if(_idnt('isEqual'), [
				// if s1 {
				_if(_idnt('s1'), [
					// loop := true
					_assign('loop', true_token)
				// } else {
				], [
					// loop := false
					_assign('loop', false_token)
				// }
				])
			// } else {
			], [
				// loop := false
				_assign('loop', false_token)
			// }
			]),
	 	// }
		]),
	],
	// } write isEqual
	output: _idnt('isEqual'),
}
export default EQUALS_PROG;

/*
(*
Pure WHILE program to check the equality of two binary trees.
Input is in the form <a.b> where `a` and `b` are the two trees to compare.
Output is true (<nil.nil>) if the trees are equal, or false (nil) otherwise.

Equality is checked by performing a depth-first traversal through the trees,
checking that every `nil` is at the same position in each tree.
*)

myequals read TS {
	//Split the input into the two trees
    t1 := hd TS;
    t2 := tl TS;

	//Initialise two stacks to hold the discovered, untested nodes in the trees
    s1 := cons t1 nil;
    s2 := cons t2 nil;

	//Hold whether or not a difference has been found in the trees
    isEqual := true;

    //Loop for as long as the trees are not fully traversed
    //and no differences have been found
    loop := cons nil nil;
    while loop {
		//Pop the next unvisited subtree from the t1 stack
        t1 := hd s1;
        s1 := tl s1;
		//Pop the next unvisited subtree from the t2 stack
        t2 := hd s2;
        s2 := tl s2;

        if t1 {
            if t2 {
            	// t1 and t2 are both not nil
                // Nodes may be equal here

                // Add the t1 subtrees to the stack
                s1 := cons (hd t1) s1;
                s1 := cons (tl t1) s1;

                // Add the t2 subtrees to the stack
                s2 := cons (hd t2) s2;
                s2 := cons (tl t2) s2
            } else {
            	//t2 is nil and t1 is not nil
                //The trees are different
                isEqual := false
            }
        } else {
            if t2 {
            	//t1 is nil and t2 is not nil
                //The trees are different
                isEqual := false
            } else {
            	//t1 and t2 are both nil
                //Subtrees are equal here
            }
        };

        if isEqual {
            if s1 {
                //Trees are so far equal and not completely traversed
                //Keep checking
                loop := true
            } else {
                //Trees are completely traversed and are found to be equal
            	//Stop checking
                loop := false
            }
        } else {
            //Trees have been found to be not equal
            //Stop checking
            loop := false
        }
    }
} write isEqual
*/