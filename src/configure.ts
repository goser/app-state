export type Reducer<S = any, A = any> = (state: S, action: A) => S;

export type ReducerMap<S = any, A = any, AA extends A = any> = keyof S extends any
    ? {
        [K in keyof S]: Reducer<S[K], AA>
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

export const configure = <S = any, A = any>(options: ConfigurationOptions<S, A>): Store<S, A> => {
    let state = options.initialState || {} as S;
    return {
        getState: () => state,
        dispatch: (action) => {
            if (typeof options.reducer === 'function') {
                state = options.reducer(state, action);
            } else {
                Object.entries<Reducer<S, A>>(options.reducer as any).forEach(([prop, reducer]) => {
                    const prev = state[prop];
                    const next = reducer(prev, action);
                    if (prev !== next) {
                        state = {...state, [prop]: next}
                    }
                });
            }
        },
    }
}