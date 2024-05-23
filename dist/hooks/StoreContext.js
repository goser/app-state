import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
var DEFAULT = {
    store: {
        dispatch: function () { },
        getState: function () { return ({}); },
        subscribe: function () { },
        unsubscribe: function () { },
    }
};
var Context = createContext(DEFAULT);
export var useStoreContext = function () { return useContext(Context); };
export var StoreProvider = function (_a) {
    var children = _a.children, store = _a.store;
    var value = useMemo(function () {
        return {
            store: store,
        };
    }, [store]);
    return _jsx(Context.Provider, { value: value, children: children });
};
