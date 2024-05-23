import {combineReducers} from '../reducer/combineReducers';
import {Reducer, ReducerNode} from '../reducer/Reducer';
import {AsyncAction, AsyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionDoneSuffix, asyncActionLoadingSuffix} from './AsyncAction';
import {Loader} from './Loader';
import {StoreSubscriber} from './StoreSubscriber';
import {TypedAction} from './TypedAction';

type AddReducer<State, Action extends TypedAction, Self> = {
    <S extends State, R = unknown>(
        selector: (state: S) => R,
        reducer: ReducerNode<R, Action>
    ): Self
    (reducer: ReducerNode<State, Action>): Self
}

interface AddCase<State, Action extends TypedAction, Self> {
    <Type extends Action['type']>(
        type: Type,
        reducer: Reducer<State, Extract<Action, {type: Type}>>
    ): Self
}

interface Base<State, Action extends TypedAction> {
    addReducer: AddReducer<State, Action, this>
    addCase: AddCase<State, Action, this>
}

interface Parent<State, Action extends TypedAction> {
    addReducer: AddReducer<State, Action, this>
    addCase: AddCase<State, Action, this>
    nested: <R = unknown>(
        selector: (state: State) => R,
        handler: <C extends ParentOrBase<R, Action>>(config: C) => C
    ) => this
}

type ParentOrBase<State, Action extends TypedAction> = State extends Function
    ? Base<State, Action>
    : (State extends object
        ? Parent<State, Action>
        : Base<State, Action>)

export interface Configurator<State, Action extends TypedAction> extends Parent<State, Action> {
    addAsyncAction: <Type extends string, L extends Loader>(
        type: Exclude<Type, Action['type']>,
        promiseCreator: L
    ) => Configurator<State, Action
        | (Parameters<L>['length'] extends 0 ? {type: Type} : {type: Type, params: Parameters<L>})
        | {type: `${Type}${AsyncActionDoneSuffix}`, data: Awaited<ReturnType<L>>}
        | {type: `${Type}${AsyncActionLoadingSuffix}`}>

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

const createWrapper = <S, A extends TypedAction, R>(selector: (state: S) => R, reducer: Reducer<R, A>) => {
    let path: SelectorPath;
    return (state: S, action: A): S => {
        let subState: R;
        if (!path) {
            path = resolvePathForSelector(state, selector);
        }
        subState = selector(state);
        const newSubState = reducer(subState, action);
        if (newSubState !== subState) {
            return reduceByPath(state, [...path], newSubState);
        }
        return state;
    }
}

class Config<S, A extends TypedAction> implements Configurator<S, A> {

    protected reducers: ReducerNode<S, A>[] = [];
    protected postActions: AsyncAction<any>[] = [];

    addCase(type: string, reducer: Reducer<any, any>) {
        this.reducers.push((s, a) => {
            if (a.type === type) {
                return reducer(s, a);
            }
            return s;
        });
        return this
    }

    private addNestedReducer = <R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, A>) => {
        reducer = combineReducers(reducer);
        this.reducers.push(createWrapper<S, A, R>(selector, reducer));
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
        const config = new Config<any, A>();
        handler(config as any);
        this.addNestedReducer(selector, config.reducers);
        return this;
    }

    addAsyncAction(type: any, loader: any) {
        this.reducers.push((state, action) => {
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
        });
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
                state = reducer(state, action);
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
    scope: <S, A extends TypedAction>() => Configurator<S, A>
}

export const Store: StoreConfigRoot = {
    scope: <S, A extends TypedAction>() => new Config<S, A>()
};

export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
    subscribe: (subscriber: StoreSubscriber<S>) => void
    unsubscribe: (subscriber: StoreSubscriber<S>) => void
}
