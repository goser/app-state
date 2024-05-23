import { Reducer } from 'react';
import { ReducerNode } from './Reducer';
export declare const combineReducers: <S, A>(...reducers: ReducerNode<S, A>[]) => Reducer<S, A>;
