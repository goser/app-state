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
    type StateA = {abc: number};
    type StateB = {def: string};
    type MyState = {
        aaa: StateA,
        bbb: StateB,
    };
    type ActionA = {type: 'doA'};
    type ActionB = {type: 'doB'};
    type MyAction = ActionA | ActionB;
    const store = configure<MyState, MyAction>({
        reducer: {
            aaa: (state: StateA, action: ActionA): StateA => {
                switch (action.type) {
                    case 'doA':
                        return {...state, abc: 456}
                }
                return state;
            },
            bbb: (state: StateB, action: ActionB): StateB => {
                switch (action.type) {
                    case 'doB':
                        return {...state, def: 'BBB'}
                }
                return state;
            },
        },
        initialState: {
            aaa: {abc: 123},
            bbb: {def: 'AAA'}
        }
    });

    expect(store.getState().aaa.abc).toBe(123);
    expect(store.getState().bbb.def).toBe('AAA');

    store.dispatch({type: 'doA'});

    expect(store.getState().aaa.abc).toBe(456);
    expect(store.getState().bbb.def).toBe('AAA');
});

// test('Dono', () => {
//     const store = configure({
//         reducer: {
//             part1: {
//                 sub1: (state, action) => state
//             }
//         }
//     });
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



