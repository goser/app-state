import {Dispatch} from 'react';
import {Reducer, ReducerNode} from './Reducer';
import {Store, StoreSubscriber} from './Store';
import {combineReducers} from './combineReducers';

export type ConfigurationOptions<S = any, A = any> = {
    reducer: ReducerNode<S, A>
    initialState: S
};

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

export const configureStore = <S = any, A = any>(options: ConfigurationOptions<S, A>): Store<S, A> => {
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