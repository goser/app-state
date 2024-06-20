var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var reduce = function (state, action, reducer, root) {
    if (typeof reducer === 'function') {
        return reducer(state, action, root);
    }
    else if (Array.isArray(reducer)) {
        for (var _i = 0, reducer_1 = reducer; _i < reducer_1.length; _i++) {
            var subReducer = reducer_1[_i];
            state = reduce(state, action, subReducer, root);
        }
        return state;
    }
    else if (Object.getPrototypeOf(reducer) === Object.prototype) {
        var changes = {};
        var hasChanges = false;
        for (var _a = 0, _b = Object.keys(reducer); _a < _b.length; _a++) {
            var prop = _b[_a];
            var next = reduce(state[prop], action, reducer[prop], root);
            if (state[prop] !== next) {
                hasChanges = true;
                changes[prop] = next;
            }
        }
        state = hasChanges ? __assign(__assign({}, state), changes) : state;
        return state;
    }
    return reducer;
};
export function combineReducers() {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    return function (state, action, root) {
        return reduce(state, action, reducers, root);
    };
}
