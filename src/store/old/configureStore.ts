import {Reducer, ReducerNode} from '../../reducer/Reducer';
import {combineReducers} from '../../reducer/combineReducers';
import {AsyncAction, AsyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionDoneSuffix, asyncActionLoadingSuffix} from '../AsyncAction';
import {Store} from '../Store';
import {StoreSubscriber} from '../StoreSubscriber';
import {TypedAction} from '../TypedAction';

type AsyncStateReducer = ((...args: any) => Promise<any>) & {type: string, loader: (...args: any) => Promise<any>}

export type GetActionFromAsyncReducer<T extends AsyncStateReducer> =
    (Parameters<T['loader']>['length'] extends 0 ? {type: T['type']} : {type: T['type'], params: Parameters<T['loader']>[0]})
    | {type: `${T['type']}${AsyncActionLoadingSuffix}`}
    | {type: `${T['type']}${AsyncActionDoneSuffix}`, data: Awaited<ReturnType<T['loader']>>};

export let asyncActions: AsyncAction<any>[] = [];

export const createAsyncReducer = <Loader extends (...args: any) => Promise<any>, Type extends string>(type: Type, loader: Loader) => {
    const reducer = <S, A extends TypedAction>(state: S, action: A) => {
        if (action.type === type) {
            asyncActions.push((dispatch) => {
                const promise = loader((action as any).params);
                dispatch({type: `${type}${asyncActionLoadingSuffix}`} as any);
                promise.then(data => {
                    dispatch({type: `${type}${asyncActionDoneSuffix}`, data} as any);
                });
            });
        }
        return state;
    }
    reducer.type = type;
    reducer.loader = loader;
    return reducer;
}

export const createAsyncReducerObject = <
    Type extends string,
    Loader extends (...args: any) => Promise<any>,
>(type: Type, loader: Loader) => {
    type LoadingAction = {type: `${Type}${AsyncActionLoadingSuffix}`};
    type DoneAction = {type: `${Type}${AsyncActionDoneSuffix}`, data: string};
    return <S, A extends TypedAction>(reducers: {loading?: Reducer<S, LoadingAction>, done?: Reducer<S, DoneAction>}) => {
        return (state: S, action: A) => {
            switch (action.type) {
                case type:
                    asyncActions.push((dispatch) => {
                        loader().then(data => {
                            dispatch({type: `${type}${asyncActionLoadingSuffix}`, data} as any);
                        });
                    });
                    if (reducers.loading) {
                        return reducers.loading(state, action as any);
                    }
                    break;
                case `${type}${asyncActionLoadingSuffix}`:
                    if (reducers.done) {
                        return reducers.done(state, action as any);
                    }
                    break;
            }
            return state;
        }
    }
}

export type ConfigurationOptions<S, A extends TypedAction> = {
    reducer: ReducerNode<S, A>
    initialState: S
};

export const configureStore = <S, A extends TypedAction>(options: ConfigurationOptions<S, A>): Store<S, A> => {
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