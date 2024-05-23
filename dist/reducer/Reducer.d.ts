export type Reducer<S, A> = (state: S, action: A) => S;
export type ReducerNode<S, A> = Reducer<S, A> | ReducerMap<S, A> | ReducerNode<S, A>[];
export type ReducerMap<S, A> = keyof S extends any ? {
    [K in keyof S]?: ReducerNode<S[K], A>;
} : never;
