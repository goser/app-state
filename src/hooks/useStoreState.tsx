import {useMemo, useState} from 'react';
import {useStoreContext} from './StoreContext';

export function useStoreState<State>(): State;
export function useStoreState<State, R>(selector?: (state: State) => R): R;
export function useStoreState<State, R>(selector?: any): any {
    const {store} = useStoreContext<State, any>();
    const [, forceUpdate] = useState<{}>(Object.create(null));
    useMemo(() => {
        const onDispatch = () => {
            console.log('onDispatch()');
            forceUpdate(Object.create(null));
        }
        store.subscribe(onDispatch);
    }, [store]);
    if (selector) {
        return selector(store.getState());
    }
    return store.getState();
};
