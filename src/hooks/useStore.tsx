import {useEffect, useState} from 'react';
import {useStoreContext} from './StoreContext';

export const useStore = <S, A>() => {
    const {store} = useStoreContext<S, A>();
    const [, forceUpdate] = useState<{}>(Object.create(null));
    useEffect(() => {
        const onDispatch = (previousState: S, currentState: S) => {
            if (previousState !== currentState) {
                forceUpdate(Object.create(null));
            }
        }
        store.subscribe(onDispatch);
        () => {
            store.unsubscribe(onDispatch);
        }
    }, [store]);
    return store;
};