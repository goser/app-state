import {Store, StoreSubscriber} from './Store';

export type Reducer<S = any, A = any> = (state: S, action: A) => S;

export type ReducerNode<S = any, A = any> = Reducer<S, A> | ReducerMap<S, A>

export type ReducerMap<S = any, A = any> = keyof S extends any
    ? {
        [K in keyof S]?: ReducerNode<S[K], A>
    } & {reducer?: Reducer<S, A>}
    : never

export type ConfigurationOptions<S = any, A = any> = {
    reducer: ReducerNode<S, A>
    initialState: S
};

const reduce = <S = any, A = any>(state: S, action: A, reducer: ReducerNode<S, A>): S => {
    if (typeof reducer === 'function') {
        return reducer(state, action);
    } else if (Object.getPrototypeOf(reducer) === Object.prototype) {
        const changes: Partial<S> = {};
        let hasChanges = false;
        let rootReducer: ReducerNode<S, A> | null = null;
        Object.entries<ReducerNode<S, A>>(reducer as any).forEach(([prop, reducer]) => {
            if (prop === 'reducer') {
                rootReducer = reducer;
                return;
            }
            const next = reduce((state as any)[prop], action, reducer);
            if ((state as any)[prop] !== next) {
                hasChanges = true;
                (changes as any)[prop] = next;
            }
        });
        state = hasChanges ? {...state, ...changes} : state;
        if (rootReducer) {
            state = reduce(state, action, rootReducer);
        }
        return state;
    }
    return reducer as any;
}

export const configure = <S = any, A = any>(options: ConfigurationOptions<S, A>): Store<S, A> => {
    let state = options.initialState || {} as S;
    let isDispatching = false;
    let subscribers: StoreSubscriber[] = [];

    const unsubscribe = (subscriber: StoreSubscriber) => {
        subscribers = subscribers.filter(sub => sub !== subscriber);
    };

    return {
        getState: () => state,
        dispatch: (action) => {
            if (isDispatching) {
                throw Error('Dispatch inside reducer is not allowed!');
            }
            try {
                isDispatching = true;
                state = reduce(state, action, options.reducer);
            } finally {
                isDispatching = false;
            }
            subscribers.forEach(subscriber => subscriber());
        },
        subscribe: (subscriber) => {
            unsubscribe(subscriber);
            subscribers.push(subscriber);
        },
        unsubscribe,
    }
}