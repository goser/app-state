import {useEffect, useState} from 'react';
import {useStoreContext} from './StoreContext';
import {StoreSubscriber} from '../Store';

export function useStoreState<S>(): S;
export function useStoreState<S, R>(selector?: (state: S) => R): R;
export function useStoreState<S, R>(selector?: any): any {
    const {store} = useStoreContext<S, any>();
    const [, forceUpdate] = useState<{}>(Object.create(null));
    useEffect(() => {
        const onDispatch: StoreSubscriber<S> = (previousState, currentState) => {
            if (previousState !== currentState) {
                if (selector) {
                    if (selector(previousState) === selector(currentState)) {
                        return;
                    }
                }
                forceUpdate(Object.create(null));
            }
        }
        store.subscribe(onDispatch);
        return () => {
            store.unsubscribe(onDispatch);
        }
    }, [store, selector]);
    if (selector) {
        return selector(store.getState());
    }
    return store.getState();
};
