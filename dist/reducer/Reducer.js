export {};
// type ReducerMap1<S, A> = keyof S extends any
//     ? {
//         [K in keyof S]?: Reducer<S[K], A> | ReducerMap1<S[K], A>
//     }
//     : never
// type ReducerMap2<S, A, R> = keyof S extends any
//     ? {
//         [K in keyof S]?: NestedReducer<S[K], A, R> | ReducerMap2<S[K], A, R>
//     }
//     : never
// type S = {
//     nest: {
//         name: string
//     }
// }
// type A = {type: 'go'}
// interface addReducer<S, A, R, Self> {
//     (reducer: NestedReducer<S, A, R>): Self
//     (reducer: Reducer<S, A>): Self
//     (map: ReducerMap2<S, A, R>): Self
//     (map: ReducerMap1<S, A>): Self
// }
// interface Conf<S, A> {
//     addReducer: addReducer<S, A, S, this>
// }
// let conf: Conf<S, A>;
// conf!
//     .addReducer((s, a) => s)
//     .addReducer((s, a, r) => s)
//     .addReducer({
//         nest: (s, a, r) => s
//     }).addReducer({
//         nest: (s, a) => s
//     })
// function combine<S, A, R>(...rest: NestedReducer<S, A, R>[]): void;
// function combine<S, A, R>(...rest: Reducer<S, A>[]): void;
// function combine<S, A, R>(...rest: (Reducer<S, A> | NestedReducer<S, A, R>)[]) {
// }
// combine<S, A, S>((s, a) => s, (s, a, r) => s);
// combine<S, A, S>((s, a, r) => s, (s, a) => s);
