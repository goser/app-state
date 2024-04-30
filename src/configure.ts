export type Reducer<S = any, A = any> = (state: S, action: A) => S;

export type ReducerMap<S = any, A = any, AA extends A = any> = keyof S extends any
    ? {
        [K in keyof S]: Reducer<S[K], AA> | ReducerMap<S[K], AA>
    }
    : never

export type ConfigurationOptions<S = any, A = any> = {
    reducer: Reducer<S, A> | ReducerMap<S, A>
    initialState?: S
};

export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
}

const reduce = <S = any, A = any>(state: S, action: A, reducer: Reducer<S, A> | ReducerMap<S, A>): S => {
    if (typeof reducer === 'function') {
        return reducer(state, action);
    } else {
        const changes: Partial<S> = {};
        let hasChanges = false;
        Object.entries<Reducer<S, A>>(reducer as any).forEach(([prop, reducer]) => {
            const next = reduce(state[prop], action, reducer);
            if (state[prop] !== next) {
                hasChanges = true;
                changes[prop] = next;
            }
        });
        return hasChanges ? {...state, ...changes} : state;
    }
}

export const configure = <S = any, A = any>(options: ConfigurationOptions<S, A>): Store<S, A> => {
    let state = options.initialState || {} as S;
    return {
        getState: () => state,
        dispatch: (action) => {
            state = reduce(state, action, options.reducer);
        },
    }
}