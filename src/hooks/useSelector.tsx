import {useEffect, useState} from 'react';
import {useStoreContext} from './StoreContext';
import {StoreSubscriber} from '../store/StoreSubscriber';

export interface UseSelector<State = unknown> {

    <S extends State = State, R = unknown>(selector: (state: S) => R): R
    <S extends State = State, R = unknown>(): S

    wrap: <S extends State>() => UseSelector<S>
}

const useSelectorIntern = <S, R>(selector?: (state: S) => R) => {
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
}

Object.assign(useSelectorIntern, {
    wrap: () => useSelectorIntern
});

export const useSelector = useSelectorIntern as UseSelector;
