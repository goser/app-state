import {ReducerNode} from '../reducer/Reducer';
import {combineReducers} from '../reducer/combineReducers';
import {AsyncAction, AsyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionDoneSuffix, asyncActionLoadingSuffix} from './AsyncAction';
import {Loader} from './Loader';
import {Store, StoreSubscriber} from './Store';
import {TypedAction} from './TypedAction';

type LoaderMap<A extends TypedAction> = {
    [K in A['type']]?: (...args: any) => Promise<any>
}

type Configurator<S, A extends TypedAction> = {
    addLoader: <T extends string, L extends Loader>(type: T, loader: L) => WithAsyncAction<S, A, T, L>
    addReducer: (reducer: ReducerNode<S, A>) => Configurator<S, A>
    create: (initialState: S) => Store<S, A>
    types: A['type']
}

type WithAsyncAction<S, A extends TypedAction, T extends string, L extends Loader> =
    Configurator<S, A
        | {type: T, params: Parameters<L>[0]}
        | {type: `${T}${AsyncActionDoneSuffix}`, data: Awaited<ReturnType<L>>}
        | {type: `${T}${AsyncActionLoadingSuffix}`}
    >

export const createStoreConfigurator = <S, A extends TypedAction>(): Configurator<S, A> => {
    const loaders: LoaderMap<A> = {};
    const reducers: ReducerNode<S, A>[] = [];
    let postActions: AsyncAction<any>[] = [];
    const configurator: Configurator<S, A> = {
        // TODO prevent overwriting existing actions
        addLoader: <T extends string, L extends Loader>(type: T, loader: L): WithAsyncAction<S, A, T, L> => {
            loaders[type] = loader;
            reducers.push((state, action) => {
                if (action.type === type) {
                    postActions.push((dispatch) => {
                        dispatch({type: `${type}${asyncActionLoadingSuffix}`} as any);
                        loader(action as any).then(data => {
                            dispatch({type: `${type}${asyncActionDoneSuffix}`, data} as any);
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