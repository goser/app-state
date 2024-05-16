import {Dispatch} from 'react';
import {Reducer, ReducerNode} from './Reducer';
import {Store, StoreSubscriber} from './Store';
import {combineReducers} from './combineReducers';

const asyncStateActionLoadingExtension = '.loading';
const asyncStateActionDoneExtension = '.done';

type AsyncStateActionLoadingExtension = typeof asyncStateActionLoadingExtension;
type AsyncStateActionDoneExtension = typeof asyncStateActionDoneExtension;

type AsyncAction<A extends {type: string}> = (dispatch: Dispatch<A>) => void;
type AsyncStateReducer = ((...args: any) => Promise<any>) & {type: string, loader: (...args: any) => Promise<any>}

export type GetActionFromAsyncReducer<T extends AsyncStateReducer> =
    {type: T['type'], params: Parameters<T['loader']>[0]}
    | {type: `${T['type']}${AsyncStateActionLoadingExtension}`}
    | {type: `${T['type']}${AsyncStateActionDoneExtension}`, data: Awaited<ReturnType<T['loader']>>};

let asyncActions: AsyncAction<any>[] = [];

export const createAsyncReducer = <Loader extends (...args: any) => Promise<any>, Type extends string>(type: Type, loader: Loader) => {
    const reducer = <S, A extends {type: string}>(state: S, action: A) => {
        if (action.type === type) {
            asyncActions.push((dispatch) => {
                const promise = loader((action as any).params);
                dispatch({type: `${type}${asyncStateActionLoadingExtension}`} as any);
                promise.then(data => {
                    dispatch({type: `${type}${asyncStateActionDoneExtension}`, data} as any);
                });
            });
        }
        return state;
    }
    reducer.type = type;
    reducer.loader = loader;
    return reducer;
}

type AddAsyncActions<A extends {type: string}, Type extends string, Data> = A
    | {type: `${Type}${AsyncStateActionLoadingExtension}`}
    | {type: `${Type}${AsyncStateActionDoneExtension}`, data: Data}

export const createAsyncReducerFactory = <Action extends {type: string},>() => {
    return {
        create: <Type extends Action['type'], Loader extends (action: Extract<Action, {type: Type}>) => Promise<any>>(typeString: Type, loader: Loader) => {
            return <S, A extends {type: string}>(reducer: Reducer<S, AddAsyncActions<A, Type, Awaited<ReturnType<Loader>>>>) => {
                return (state: S, action: A) => {
                    switch (action.type) {
                        case typeString:
                            asyncActions.push((dispatch) => {
                                dispatch({type: `${typeString}${asyncStateActionLoadingExtension}`} as any);
                                loader(action as any).then(data => {
                                    dispatch({type: `${typeString}${asyncStateActionDoneExtension}`, data} as any);
                                });
                            });
                            break;
                    }
                    return reducer(state, action);
                };
            }
        }
    }
}

export const createAsyncReducerObject = <
    Type extends string,
    Loader extends (...args: any) => Promise<any>,
>(type: Type, loader: Loader) => {
    type LoadingAction = {type: `${Type}${AsyncStateActionLoadingExtension}`};
    type DoneAction = {type: `${Type}${AsyncStateActionDoneExtension}`, data: string};
    return <S, A extends {type: string}>(reducers: {loading?: Reducer<S, LoadingAction>, done?: Reducer<S, DoneAction>}) => {
        return (state: S, action: A) => {
            switch (action.type) {
                case type:
                    asyncActions.push((dispatch) => {
                        loader().then(data => {
                            dispatch({type: `${type}${asyncStateActionLoadingExtension}`, data} as any);
                        });
                    });
                    if (reducers.loading) {
                        return reducers.loading(state, action as any);
                    }
                    break;
                case `${type}${asyncStateActionLoadingExtension}`:
                    if (reducers.done) {
                        return reducers.done(state, action as any);
                    }
                    break;
            }
            return state;
        }
    }
}

export type Loaders<A extends {type: string}> = {
    [K in A['type']]?: (...args: any) => Promise<any>
} | undefined

type ToReturnTypeMap<A extends {type: string}, L extends Loaders<A>> = keyof L extends any ? {
    [K in keyof L]: Awaited<ReturnType<L[K] extends () => Promise<any> ? L[K] : never>>
} : never

type MapReturnTypes<T> = T extends any ? {[K in keyof T]: Awaited<ReturnType<T[K] extends () => any ? T[K] : never>>} : never
type Dupe<T, Suffix extends string> = keyof T extends any ? ({[K in keyof T]: {type: `${K extends string ? K : never}${Suffix}`, data: T[K]}}) : never
type UnionMap<T> = T[keyof T]

type DoneAction<T> = UnionMap<Dupe<MapReturnTypes<T>, AsyncStateActionDoneExtension>>

type Dupe2<T, Suffix extends string> = keyof T extends any ? ({[K in keyof T]: {type: `${K extends string ? K : never}${Suffix}`}}) : never
type LoadingAction<T> = UnionMap<Dupe2<T, AsyncStateActionLoadingExtension>>

export type ConfigurationOptions<S, A extends {type: string}> = {
    reducer: ReducerNode<S, A>
    initialState: S
};

type Loader = (...args: any) => Promise<any>


type Configurator<S, A extends {type: string}> = {
    addLoader: <T extends string, L extends Loader>(type: T, loader: L) => WithAsyncAction<S, A, T, L>
    addReducer: (reducer: ReducerNode<S, A>) => Configurator<S, A>
    create: (initialState: S) => Store<S, A>
    types: A['type']
}

type WithAsyncAction<S, A extends {type: string}, T extends string, L extends Loader> =
    Configurator<
        S,
        A | {type: T, params: Parameters<L>[0]} | {type: `${T}.done`, data: Awaited<ReturnType<L>>} | {type: `${T}.loading`}
    >

export const createStoreConfigurator = <S, A extends {type: string}>(): Configurator<S, A> => {
    const loaders: Loaders<A> = {};
    const reducers: ReducerNode<S, A>[] = [];
    let postActions: AsyncAction<any>[] = [];
    const configurator: Configurator<S, A> = {
        // TODO prevent overwriting existing actions
        addLoader: <T extends string, L extends Loader>(type: T, loader: L): WithAsyncAction<S, A, T, L> => {
            loaders[type] = loader;
            reducers.push((state, action) => {
                if (action.type === type) {
                    postActions.push((dispatch) => {
                        dispatch({type: `${type}${asyncStateActionLoadingExtension}`} as any);
                        loader(action as any).then(data => {
                            dispatch({type: `${type}${asyncStateActionDoneExtension}`, data} as any);
                        });
                    });
                }
                return state;
            });
            return configurator as any;
        },
        addReducer: (reducer: ReducerNode<S, A>) => {
            reducers.push(reducer);
            return configurator;
        },
        create: (initialState: S): Store<S, A> => {
            let state = initialState;
            let isDispatching = false;
            let subscribers: StoreSubscriber<S>[] = [];
            const unsubscribe = (subscriber: StoreSubscriber<S>) => {
                subscribers = subscribers.filter(sub => sub !== subscriber);
            };
            const reducer = combineReducers(reducers);
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
                const actions = postActions;
                postActions = [];
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
        },
        types: '' as any
    };
    return configurator;
}

export const configureStore = <S, A extends {type: string}>(options: ConfigurationOptions<S, A>): Store<S, A> => {
    let state = options.initialState || {} as S;
    let isDispatching = false;
    let subscribers: StoreSubscriber<S>[] = [];
    const unsubscribe = (subscriber: StoreSubscriber<S>) => {
        subscribers = subscribers.filter(sub => sub !== subscriber);
    };
    const reducer = combineReducers(options.reducer);

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
            const actions = asyncActions;
            asyncActions = [];
            actions.forEach(action => action(dispatch));
        }
        subscribers.forEach(subscriber => subscriber(previousState, state));
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