import { PropsWithChildren, ReactNode } from 'react';
import { Store } from '../store/Store';
type ContextType<T, A> = {
    store: Store<T, A>;
};
export declare const useStoreContext: <S, A>() => ContextType<S, A>;
type StoreProviderProps<S, A> = PropsWithChildren<{
    store: Store<S, A>;
}>;
export declare const StoreProvider: <S, A>({ children, store }: StoreProviderProps<S, A>) => ReactNode;
export {};
