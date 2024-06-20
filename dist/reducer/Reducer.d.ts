export type Reducer<S, A> = (state: S, action: A) => S;
export type NestedReducer<S, A, R> = (state: S, action: A, root: R) => S;
export type ReducerNode<S, A, R> = (R extends any ? NestedReducer<S, A, R> : Reducer<S, A>) | ReducerMap<S, A, R> | ReducerNode<S, A, R>[];
export type ReducerMap<S, A, R> = keyof S extends any ? {
    [K in keyof S]?: ReducerNode<S[K], A, R>;
} : never;
