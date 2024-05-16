import {PropsWithChildren, ReactNode, createContext, useContext, useMemo} from 'react';
import {Store} from '../store/Store';

type ContextType<T, A> = {
    store: Store<T, A>
}

const DEFAULT: ContextType<any, any> = {
    store: {
        dispatch: () => { },
        getState: () => ({}),
        subscribe: () => { },
        unsubscribe: () => { },
    }
}

const Context = createContext(DEFAULT);

export const useStoreContext = <S, A>() => useContext<ContextType<S, A>>(Context);

type StoreProviderProps<S, A> = PropsWithChildren<{
    store: Store<S, A>
}>

export const StoreProvider = <S, A>({children, store}: StoreProviderProps<S, A>): ReactNode => {
    const value = useMemo(() => {
        return {
            store,
        }
    }, [store]);
    return <Context.Provider value={value}>
        {children}
    </Context.Provider>
}
