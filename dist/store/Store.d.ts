import { NestedReducer, ReducerNode } from '../reducer/Reducer';
import { AsyncActionDoneSuffix, AsyncActionLoadingSuffix } from './AsyncAction';
import { Loader } from './Loader';
import { StoreSubscriber } from './StoreSubscriber';
import { TypedAction } from './TypedAction';
type AddReducer<State, Action extends TypedAction, Root, Self> = {
    <S extends State, R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, Action, Root>): Self;
    (reducer: ReducerNode<State, Action, Root>): Self;
};
interface AddCase<State, Action extends TypedAction, Root, Self> {
    <Type extends Action['type']>(type: Type, reducer: NestedReducer<State, Extract<Action, {
        type: Type;
    }>, Root>): Self;
}
interface Base<State, Action extends TypedAction, Root> {
    addReducer: AddReducer<State, Action, Root, this>;
    addCase: AddCase<State, Action, Root, this>;
}
interface Parent<State, Action extends TypedAction, Root> {
    addReducer: AddReducer<State, Action, Root, this>;
    addCase: AddCase<State, Action, Root, this>;
    nested: <R = unknown>(selector: (state: State) => R, handler: <C extends ParentOrBase<R, Action, Root>>(config: C) => C) => this;
}
type ParentOrBase<State, Action extends TypedAction, Root> = State extends Function ? Base<State, Action, Root> : (State extends object ? Parent<State, Action, Root> : Base<State, Action, Root>);
export interface Configurator<State, Action extends TypedAction, Root> extends Parent<State, Action, Root> {
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
    }, Root>;
    create: (initialState: State) => Store<State, Action>;
}
type StoreConfigRoot = {
    scope: <S, A extends TypedAction>() => Configurator<S, A, S>;
};
export declare const Store: StoreConfigRoot;
export type Store<S = any, A = any> = {
    getState: () => S;
    dispatch: (action: A) => void;
    subscribe: (subscriber: StoreSubscriber<S>) => void;
    unsubscribe: (subscriber: StoreSubscriber<S>) => void;
};
export {};
