import {useEffect, useState} from 'react';
import {useStoreContext} from './StoreContext';
import {StoreSubscriber} from '../Store';

export function useSelector<S>(): S;
export function useSelector<S, R>(selector?: (state: S) => R): R;
export function useSelector<S, R>(selector?: any): any {
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
