export type Reducer<S = any, A = any> = (state: S, action: A) => S

export type ReducerNode<S = any, A = any> = Reducer<S, A> | ReducerMap<S, A> | ReducerNode<S, A>[]

export type ReducerMap<S = any, A = any> = keyof S extends any
    ? {
        [K in keyof S]?: ReducerNode<S[K], A>
    } & {_?: Reducer<S, A>}
    : never