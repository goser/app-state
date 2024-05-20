import {TypedAction} from '../store/TypedAction'

export type Reducer<S, A extends TypedAction> = (state: S, action: A) => S

export type ReducerNode<S, A extends TypedAction> = Reducer<S, A> | ReducerMap<S, A> | ReducerNode<S, A>[]

export type ReducerMap<S, A extends TypedAction> = keyof S extends any
    ? {
        [K in keyof S]?: ReducerNode<S[K], A>
    }
    : never