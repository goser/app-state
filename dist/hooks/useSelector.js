import { useEffect, useState } from 'react';
import { useStoreContext } from './StoreContext';
var useSelectorIntern = function (selector) {
    var store = useStoreContext().store;
    var _a = useState(Object.create(null)), forceUpdate = _a[1];
    useEffect(function () {
        var onDispatch = function (previousState, currentState) {
            if (previousState !== currentState) {
                if (selector) {
                    if (selector(previousState) === selector(currentState)) {
                        return;
                    }
                }
                forceUpdate(Object.create(null));
            }
        };
        store.subscribe(onDispatch);
        return function () {
            store.unsubscribe(onDispatch);
        };
    }, [store, selector]);
    if (selector) {
        return selector(store.getState());
    }
    return store.getState();
};
Object.assign(useSelectorIntern, {
    scope: function () { return useSelectorIntern; }
});
export var useSelector = useSelectorIntern;
