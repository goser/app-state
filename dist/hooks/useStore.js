import { useEffect, useState } from 'react';
import { useStoreContext } from './StoreContext';
export var useStore = function () {
    var store = useStoreContext().store;
    var _a = useState(Object.create(null)), forceUpdate = _a[1];
    useEffect(function () {
        var onDispatch = function (previousState, currentState) {
            if (previousState !== currentState) {
                forceUpdate(Object.create(null));
            }
        };
        store.subscribe(onDispatch);
        (function () {
            store.unsubscribe(onDispatch);
        });
    }, [store]);
    return {
        dispatch: store.dispatch,
        state: store.getState(),
    };
};
