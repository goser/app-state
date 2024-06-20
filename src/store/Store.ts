import {combineReducers} from '../reducer/combineReducers';
import {NestedReducer, ReducerNode} from '../reducer/Reducer';
import {AsyncAction, AsyncActionDoneSuffix, asyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionLoadingSuffix} from './AsyncAction';
import {Loader} from './Loader';
import {StoreSubscriber} from './StoreSubscriber';
import {TypedAction} from './TypedAction';

type AddReducer<State, Action extends TypedAction, Root, Self> = {
    <S extends State, R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, Action, Root>): Self
    (reducer: ReducerNode<State, Action, Root>): Self
}

interface AddCase<State, Action extends TypedAction, Root, Self> {
    <Type extends Action['type']>(
        type: Type,
        reducer: NestedReducer<State, Extract<Action, {type: Type}>, Root>
    ): Self
}

interface Base<State, Action extends TypedAction, Root> {
    addReducer: AddReducer<State, Action, Root, this>
    addCase: AddCase<State, Action, Root, this>
}

interface Parent<State, Action extends TypedAction, Root> {
    addReducer: AddReducer<State, Action, Root, this>
    addCase: AddCase<State, Action, Root, this>
    nested: <R = unknown>(
        selector: (state: State) => R,
        handler: <C extends ParentOrBase<R, Action, Root>>(config: C) => C
    ) => this
}

type ParentOrBase<State, Action extends TypedAction, Root> = State extends Function
    ? Base<State, Action, Root>
    : (State extends object
        ? Parent<State, Action, Root>
        : Base<State, Action, Root>)

export interface Configurator<State, Action extends TypedAction, Root> extends Parent<State, Action, Root> {
    addAsyncAction: <Type extends string, L extends Loader>(
        type: Exclude<Type, Action['type']>,
        promiseCreator: L
    ) => Configurator<State, Action
        | (Parameters<L>['length'] extends 0 ? {type: Type} : {type: Type, params: Parameters<L>})
        | {type: `${Type}${AsyncActionDoneSuffix}`, data: Awaited<ReturnType<L>>}
        | {type: `${Type}${AsyncActionLoadingSuffix}`},
        Root>

    create: (initialState: State) => Store<State, Action>
};

const createPathResolvingProxy = <S>(state: S, path: (string | symbol)[]): S => {
    return new Proxy(state as object, {
        get(target, p) {
            path.push(p);
            const value = (target as any)[p];
            if (typeof value === 'object' && value !== null && value !== undefined) {
                return createPathResolvingProxy(value, path);
            }
            return value;
        },
    }) as any;
};

type SelectorPath = (string | symbol)[];

const resolvePathForSelector = <S, R = unknown>(state: S, selector: (state: S) => R) => {
    const path: SelectorPath = [];
    const proxy = createPathResolvingProxy<S>(state, path);
    selector(proxy);
    return path;
}

const reduceByPath = (state: any, path: (string | symbol)[], newValue: any): any => {
    if (path.length === 0) {
        return newValue;
    }
    const key = path.shift()!;
    return {...state, [key]: reduceByPath(state[key], path, newValue)}
}

const createWrapper = <S, A extends TypedAction, R, Root>(selector: (state: S) => R, reducer: NestedReducer<R, A, Root>) => {
    let path: SelectorPath;
    return (state: S, action: A, root: Root): S => {
        let subState: R;
        if (!path) {
            path = resolvePathForSelector(state, selector);
        }
        subState = selector(state);
        const newSubState = reducer(subState, action, root);
        if (newSubState !== subState) {
            return reduceByPath(state, [...path], newSubState);
        }
        return state;
    }
}

class Config<S, A extends TypedAction, Root> implements Configurator<S, A, Root> {

    protected reducers: ReducerNode<S, A, Root>[] = [];
    protected postActions: AsyncAction<any>[] = [];

    addCase(type: string, reducer: NestedReducer<any, any, any>) {
        this.reducers.push(((s: S, a: A, r: Root) => {
            if (a.type === type) {
                return reducer(s, a, r);
            }
            return s;
        }) as any);
        return this
    }

    private addNestedReducer = <R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, A, Root>) => {
        reducer = combineReducers(reducer) as any;
        this.reducers.push(createWrapper<S, A, R, Root>(selector, reducer as any) as any);
    }

    addReducer(...args: any) {
        if (args.length === 2) {
            this.addNestedReducer(args[0], args[1]);
        } else {
            this.reducers.push(args[0]);
        }
        return this;
    }

    nested(selector: any, handler: any) {
        const config = new Config<any, A, Root>();
        handler(config as any);
        this.addNestedReducer(selector, config.reducers);
        return this;
    }

    addAsyncAction(type: any, loader: any) {
        this.reducers.push(((state: S, action: A) => {
            if (action.type === type) {
                this.postActions.push((dispatch) => {
                    dispatch({type: `${type}${asyncActionLoadingSuffix}`} as any);
                    const params = (action as any).params || [];
                    loader(...params).then((data: any) => {
                        dispatch({type: `${type}${asyncActionDoneSuffix}`, data} as any);
                    });
                });
            }
            return state;
        }) as any);
        return this as any;
    }

    create(initialState: S): Store<S, A> {
        let state = initialState;
        let isDispatching = false;
        let subscribers: StoreSubscriber<S>[] = [];
        const unsubscribe = (subscriber: StoreSubscriber<S>) => {
            subscribers = subscribers.filter(sub => sub !== subscriber);
        };
        const reducer = combineReducers(this.reducers);
        const dispatch = (action: A) => {
            if (isDispatching) {
                throw Error('Dispatch inside reducer is not allowed!');
            }
            const previousState = state;
            try {
                isDispatching = true;
                state = reducer(state, action, state as any);
            } finally {
                isDispatching = false;
            }
            subscribers.forEach(subscriber => subscriber(previousState, state));
            const actions = this.postActions;
            this.postActions = [];
            actions.forEach(action => action(dispatch));
        }
        return {
            getState: () => state,
            dispatch,
            subscribe: (subscriber) => {
                unsubscribe(subscriber);
                subscribers.push(subscriber);
            },
            unsubscribe,
        }
    }
}

type StoreConfigRoot = {
    scope: <S, A extends TypedAction>() => Configurator<S, A, S>
}

export const Store: StoreConfigRoot = {
    scope: <S, A extends TypedAction>() => new Config<S, A, S>()
};

export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
    subscribe: (subscriber: StoreSubscriber<S>) => void
    unsubscribe: (subscriber: StoreSubscriber<S>) => void
}
