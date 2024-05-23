import { Reducer, ReducerNode } from '../reducer/Reducer';
import { AsyncActionDoneSuffix, AsyncActionLoadingSuffix } from './AsyncAction';
import { Loader } from './Loader';
import { StoreSubscriber } from './StoreSubscriber';
import { TypedAction } from './TypedAction';
type AddReducer<State, Action extends TypedAction, Self> = {
    <S extends State, R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, Action>): Self;
    (reducer: ReducerNode<State, Action>): Self;
};
interface AddCase<State, Action extends TypedAction, Self> {
    <Type extends Action['type']>(type: Type, reducer: Reducer<State, Extract<Action, {
        type: Type;
    }>>): Self;
}
interface Base<State, Action extends TypedAction> {
    addReducer: AddReducer<State, Action, this>;
    addCase: AddCase<State, Action, this>;
}
interface Parent<State, Action extends TypedAction> {
    addReducer: AddReducer<State, Action, this>;
    addCase: AddCase<State, Action, this>;
    nested: <R = unknown>(selector: (state: State) => R, handler: <C extends ParentOrBase<R, Action>>(config: C) => C) => this;
}
type ParentOrBase<State, Action extends TypedAction> = State extends Function ? Base<State, Action> : (State extends object ? Parent<State, Action> : Base<State, Action>);
export interface Configurator<State, Action extends TypedAction> extends Parent<State, Action> {
    addAsyncAction: <Type extends string, L extends Loader>(type: Exclude<Type, Action['type']>, promiseCreator: L) => Configurator<State, Action | (Parameters<L>['length'] extends 0 ? {
        type: Type;
    } : {
        type: Type;
        params: Parameters<L>;
    }) | {
        type: `${Type}${AsyncActionDoneSuffix}`;
        data: Awaited<ReturnType<L>>;
    } | {
        type: `${Type}${AsyncActionLoadingSuffix}`;
    }>;
    create: (initialState: State) => Store<State, Action>;
}
type StoreConfigRoot = {
    scope: <S, A extends TypedAction>() => Configurator<S, A>;
};
export declare const Store: StoreConfigRoot;
export type Store<S = any, A = any> = {
    getState: () => S;
    dispatch: (action: A) => void;
    subscribe: (subscriber: StoreSubscriber<S>) => void;
    unsubscribe: (subscriber: StoreSubscriber<S>) => void;
};
export {};
