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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { combineReducers } from '../reducer/combineReducers';
import { asyncActionDoneSuffix, asyncActionLoadingSuffix } from './AsyncAction';
;
var createPathResolvingProxy = function (state, path) {
    return new Proxy(state, {
        get: function (target, p) {
            path.push(p);
            var value = target[p];
            if (typeof value === 'object' && value !== null && value !== undefined) {
                return createPathResolvingProxy(value, path);
            }
            return value;
        },
    });
};
var resolvePathForSelector = function (state, selector) {
    var path = [];
    var proxy = createPathResolvingProxy(state, path);
    selector(proxy);
    return path;
};
var reduceByPath = function (state, path, newValue) {
    var _a;
    if (path.length === 0) {
        return newValue;
    }
    var key = path.shift();
    return __assign(__assign({}, state), (_a = {}, _a[key] = reduceByPath(state[key], path, newValue), _a));
};
var createWrapper = function (selector, reducer) {
    var path;
    return function (state, action) {
        var subState;
        if (!path) {
            path = resolvePathForSelector(state, selector);
        }
        subState = selector(state);
        var newSubState = reducer(subState, action);
        if (newSubState !== subState) {
            return reduceByPath(state, __spreadArray([], path, true), newSubState);
        }
        return state;
    };
};
var Config = /** @class */ (function () {
    function Config() {
        var _this = this;
        this.reducers = [];
        this.postActions = [];
        this.addNestedReducer = function (selector, reducer) {
            reducer = combineReducers(reducer);
            _this.reducers.push(createWrapper(selector, reducer));
        };
    }
    Config.prototype.addCase = function (type, reducer) {
        this.reducers.push(function (s, a) {
            if (a.type === type) {
                return reducer(s, a);
            }
            return s;
        });
        return this;
    };
    Config.prototype.addReducer = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args.length === 2) {
            this.addNestedReducer(args[0], args[1]);
        }
        else {
            this.reducers.push(args[0]);
        }
        return this;
    };
    Config.prototype.nested = function (selector, handler) {
        var config = new Config();
        handler(config);
        this.addNestedReducer(selector, config.reducers);
        return this;
    };
    Config.prototype.addAsyncAction = function (type, loader) {
        var _this = this;
        this.reducers.push(function (state, action) {
            if (action.type === type) {
                _this.postActions.push(function (dispatch) {
                    dispatch({ type: "".concat(type).concat(asyncActionLoadingSuffix) });
                    var params = action.params || [];
                    loader.apply(void 0, params).then(function (data) {
                        dispatch({ type: "".concat(type).concat(asyncActionDoneSuffix), data: data });
                    });
                });
            }
            return state;
        });
        return this;
    };
    Config.prototype.create = function (initialState) {
        var _this = this;
        var state = initialState;
        var isDispatching = false;
        var subscribers = [];
        var unsubscribe = function (subscriber) {
            subscribers = subscribers.filter(function (sub) { return sub !== subscriber; });
        };
        var reducer = combineReducers(this.reducers);
        var dispatch = function (action) {
            if (isDispatching) {
                throw Error('Dispatch inside reducer is not allowed!');
            }
            var previousState = state;
            try {
                isDispatching = true;
                state = reducer(state, action);
            }
            finally {
                isDispatching = false;
            }
            subscribers.forEach(function (subscriber) { return subscriber(previousState, state); });
            var actions = _this.postActions;
            _this.postActions = [];
            actions.forEach(function (action) { return action(dispatch); });
        };
        return {
            getState: function () { return state; },
            dispatch: dispatch,
            subscribe: function (subscriber) {
                unsubscribe(subscriber);
                subscribers.push(subscriber);
            },
            unsubscribe: unsubscribe,
        };
    };
    return Config;
}());
export var Store = {
    scope: function () { return new Config(); }
};
