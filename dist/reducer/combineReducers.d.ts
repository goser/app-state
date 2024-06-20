import { NestedReducer, ReducerNode } from './Reducer';
export declare function combineReducers<S, A, R>(...reducers: ReducerNode<S, A, R>[]): NestedReducer<S, A, R>;
