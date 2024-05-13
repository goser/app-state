import {PropsWithChildren, ReactNode, createContext, useContext, useMemo, useState} from 'react';
import {Store} from '../Store';

type ContextType<T, A> = {
    store: Store<T, A>
}

const DEFAULT: ContextType<any, any> = {
    store: {dispatch: () => { }, getState: () => ({}), subscribe: () => { }, unsubscribe: () => { }}
}

const Context = createContext(DEFAULT);

export const useStoreContext = <S, A>() => useContext<ContextType<S, A>>(Context);

// TODO how to update the store inside the Context from outside configured store

// export const getStorageContext = <S, A>() => Context as any as ContextType<S, A>;

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
