import {FC, PropsWithChildren, PropsWithoutRef, ReactNode, createContext, useContext} from 'react';
import {ConfigurationOptions, ReducerNode, Store, configure} from '../configure';

type ContextType<T, A> = {
    store: Store<T, A>
}

const DEFAULT: ContextType<any, any> = {
    store: {dispatch: () => { }, getState: () => ({})}
}


const Context = createContext(DEFAULT);
console.log('Context', Context);

type Props<S, A> = PropsWithChildren<ConfigurationOptions<S, A>>

export const StorageContextProvider = <S, A>({children}: PropsWithChildren): ReactNode => {
    const context = useStorageContext<S, A>();
    return <Context.Provider value={context as any}>
        {children}
    </Context.Provider>
}

export const useStorageContext = <S, A>() => useContext<ContextType<S, A>>(Context) as any as Store<S, A>;

// TODO how to update the store inside the Context from outside configured store

export const getStorageContext = <S, A>() => Context as any as ContextType<S, A>;