import {ReducerNode} from './Reducer';
import {Store, StoreSubscriber} from './Store';
import {combineReducers} from './combineReducers';

export type ConfigurationOptions<S = any, A = any> = {
    reducer: ReducerNode<S, A>
    initialState: S
};

export const configureStore = <S = any, A = any>(options: ConfigurationOptions<S, A>): Store<S, A> => {
    let state = options.initialState || {} as S;
    let isDispatching = false;
    let subscribers: StoreSubscriber<S>[] = [];
    const unsubscribe = (subscriber: StoreSubscriber<S>) => {
        subscribers = subscribers.filter(sub => sub !== subscriber);
    };
    const reducer = combineReducers(options.reducer);
    return {
        getState: () => state,
        dispatch: (action) => {
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
        },
        subscribe: (subscriber) => {
            unsubscribe(subscriber);
            subscribers.push(subscriber);
        },
        unsubscribe,
    }
}