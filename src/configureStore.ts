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

type WithType<T, Type> = T & {type: Type}

export const createAsyncState = <Loader extends (...args: any) => Promise<any>, Type extends string>(type: Type, loader: Loader): WithType<Loader, Type> => {
    const callback = async (...args: any[]) => {
        console.log('trigger start dispatch ', {type: type + asyncStateActionLoadingExtension});
        const response = await loader.apply(null, args);
        console.log('trigger end dispatch', {type: type + asyncStateActionDoneExtension, });
        return response;
    }
    callback.type = type;
    return callback as any as WithType<Loader, Type>;
}

type AsyncStateFunction = ((...args: any) => Promise<any>) & {type: string}

export type GetActionFromAsyncState<T extends AsyncStateFunction> = {type: T['type']}
    | {type: `${T['type']}${AsyncStateActionLoadingExtension}`}
    | {type: `${T['type']}${AsyncStateActionDoneExtension}`, data: Awaited<ReturnType<T>>};


type AsyncAction<A extends {type: string}> = (dispatch: Dispatch<A>) => void;

let asyncActions: AsyncAction<any>[] = [];

type AddAsyncActions<A extends {type: string}, Type extends string, Data> = A
    | {type: `${Type}${AsyncStateActionLoadingExtension}`}
    | {type: `${Type}${AsyncStateActionDoneExtension}`, data: Data}

export const createAsyncReducerFactory = <Action extends {type: string},>() => {
    return {
        create: <Type extends Action['type'], Loader extends (action: Extract<Action, {type: Type}>) => Promise<any>>(typeString: Type, loader: Loader) => {
            return <S, A extends {type: string}>(reducer: Reducer<S, AddAsyncActions<A, Type, Awaited<ReturnType<Loader>>>>) => {
                return (state: S, action: A) => {
                    console.log(' action', action);
                    switch (action.type) {
                        case typeString:
                            const promise = loader(action as any);
                            asyncActions.push((dispatch) => {
                                dispatch({type: `${typeString}${asyncStateActionLoadingExtension}`} as any);
                                promise.then(data => {
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

export const createAsyncReducer = <
    Type extends string,
    Loader extends (...args: any) => Promise<any>,
>(type: Type, loader: Loader) => {
    type LoadingAction = {type: `${Type}${AsyncStateActionLoadingExtension}`};
    type DoneAction = {type: `${Type}${AsyncStateActionDoneExtension}`, data: string};
    return <S, A extends {type: string}>(reducers: {loading?: Reducer<S, LoadingAction>, done?: Reducer<S, DoneAction>}) => {
        return (state: S, action: A) => {
            console.log(action);
            switch (action.type) {
                case type:
                    const promise = loader();
                    asyncActions.push((dispatch) => {
                        promise.then(data => {
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