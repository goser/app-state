import {expect, test} from 'vitest';
import {configure} from './configure';

test('Single simple reducer should work', () => {
    type MyState = {mode: 'A' | 'B'};
    type MyAction = {type: 'init'};
    const store = configure({
        reducer: (state: MyState, action: MyAction): MyState => {
            switch (action.type) {
                case 'init':
                    return {...state, mode: 'B'}
            }
        },
        initialState: {mode: 'A'}
    });
    expect(store.getState().mode).toBe('A');
    store.dispatch({type: 'init'});
    expect(store.getState().mode).toBe('B');
});

test('Mapped single level reducer should work', () => {
    type StateA = {age: number};
    type StateB = {name: string};
    type MyState = {
        a: StateA,
        b: StateB,
        c: {
            d: {
                info: string
            }
        },
        e: {f: string},
    };
    type ActionA = {type: 'doA'};
    type ActionB = {type: 'doB'};
    type MyAction = ActionA | ActionB | {type: 'update_info'};


    // TODO get the action type working inside reducers

    const store = configure<MyState, MyAction>({
        reducer: {
            a: (state, action) => {
                switch (action.type) {
                    case 'doA':
                        return {...state, age: 456}
                }
                return state;
            },
            b: (state, action) => {
                switch (action.type) {
                    case 'doB':
                        return {...state, name: 'BBB'}
                }
                return state;
            },
            c: {
                d: (state, action) => {
                    switch (action.type) {
                        case 'update_info':
                            return {...state, info: action.value};
                    }
                    return state;
                }
            },
            e: {f: (s, a) => s}
        },
        initialState: {
            a: {age: 123},
            b: {name: 'AAA'},
            c: {d: {info: 'no info'}},
            e: {f: 'hui'}
        }
    });

    expect(store.getState()).toStrictEqual({
        a: {age: 123},
        b: {name: 'AAA'},
        c: {d: {info: 'no info'}},
        e: {f: 'hui'}
    })

    expect(store.getState().a.age).toBe(123);
    expect(store.getState().b.name).toBe('AAA');

    store.dispatch({type: 'doA'});

    expect(store.getState()).toStrictEqual({
        a: {age: 456},
        b: {name: 'AAA'},
        c: {d: {info: 'no info'}},
        e: {f: 'hui'}
    });

});

// test('Should allow multi level reducers', () => {

//     // type Func<S = any, A = any> = (state: S, action: A) => S

//     // type Node<S = any, A = any, AA extends A = any> = keyof S extends any
//     //     ? {
//     //         // [K in keyof S]: S[K] extends Function ? Func<S[K], AA> : Node<S[K], AA>

//     //         [K in keyof S]: S[K]



//     //         // [K in keyof S]: S[K] extends Function ? Func<S[K]> : Node<S[K], A>
//     //         // [K in keyof S]: Func<S[K]> | Node<S[K], A>
//     //     }
//     //     : never

//     // type ConfOpts<S = any, A = any> = {
//     //     initialState?: S,
//     //     reducer: Func<S, A> | Node<S, A>
//     // };

//     // const conf = <S = any, A = any>(opts: ConfOpts<S, A>): S => {
//     //     return {} as any
//     // }

//     // const r1 = conf({
//     //     initialState: {
//     //         a: {
//     //             name: 'aaa'
//     //         }
//     //     },
//     //     reducer: (s, a) => s
//     // });
//     // const r2 = conf({
//     //     // initialState: {
//     //     //     a: {
//     //     //         name: 'aaa'
//     //     //     }
//     //     // },
//     //     reducer: {
//     //         a: (s: {name: string}, a) => s,
//     //         b: {
//     //             c: (s: {age: number}) => s
//     //         }
//     //     }
//     // });

//     // r2.b.c()



//     // type Root<S = any, A = any> = Node<S, A>;

//     // // const r1: Root = (s, a) => s;
//     // const r2: Root = {
//     //     sub1: (s, a) => s,
//     // }

//     // type MS = {name: string};

//     // const r3: Root = {
//     //     sub1: {
//     //         sub2: (s: MS, a) => s,
//     //     }
//     // }

//     // const r4: Root<{a: {b: {c: {d: number}}}}> = {
//     //     a: {
//     //         b: {
//     //             c: {
//     //                 d: 123
//     //             }
//     //         }
//     //     }
//     // };

//     // const r5: Root<{a: {b: {c: {d: number}}}}, {type: 'dodo'}> = {
//     //     a: {
//     //         b: {
//     //             c: (s, a) => s
//     //         }
//     //     }
//     // };

//     // const r6: Root = {
//     //     a: {
//     //         b: (s, a) => s
//     //     }
//     // };

// });

// // TODO add property with action creators that have unique names and mapped properties

// // export type ReducerNode<S = any, A = any> = keyof S extends any
// //     ? {
// //         [K in keyof S]: Reducer<S[K]>
// //     }
// //     : never
// export type ReducerNode<S = any, A = any> = keyof S extends any
//     ? {
//         [K in keyof S]: Reducer<S[K]>
//     }
//     : never

// type ReducersDefinition = Record<string, unknown>;

// type ReducersProp = Reducer | ReducersDefinition

// type CreateReducerOptions<Reducers extends ReducersProp = any> = {
//     reducers: Reducers
// };

// type CreateReducerResult<Reducers extends ReducersProp = any> = {
//     reducer: (state: any, action: any) => any
//     actions: {
//         [Key in ObjectKeys2MethodName<Reducers>]
//     }
// }


// const createReducer = <Reducers extends ReducersProp = any>(options: CreateReducerOptions<Reducers>): CreateReducerResult<Reducers> => {
//     const flat: any = {};
//     const internal = (node) => {
//     }
//     const flatten = (node, prefix: string) => {
//         if (typeof node === 'function') {
//             flat[prefix] = node;
//         } else {
//             Object.keys(node).forEach(key => flatten(node[key], prefix + ":" + key))
//         }
//     };
//     flatten(options.reducers, '');
//     console.log('flat', flat);

//     return {
//         reducer: (state, action) => state,
//         actions: {} as any
//     }
// }

// test('Create reducer', () => {

//     const reducers = {
//         section1: {
//             partA: (state, action) => state,
//             partB: (state, action) => state
//         },
//         section2: {
//             partC: (state, action) => state,
//             partD: {
//                 subPartA: (state, action) => state,
//                 subPartB: (state, action) => state,
//             }
//         },
//     };

//     const result = createReducer({reducers});
//     // expect(result.actions.section1PartA).toBeTypeOf('function');

//     // expect(result.reducer).toBeTypeOf('function')
// });

// test('Create reducer 2', () => {
//     type MyState = {name: 'none'};
//     type MyAction = {type: 'rename'};
//     const func = (state: MyState, action: MyAction) => state;
//     const result = createReducer({reducers: func});
// });



