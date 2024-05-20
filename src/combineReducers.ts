import {Reducer, ReducerNode} from './reducer/Reducer';

const reduce = <S = any, A = any>(state: S, action: A, reducer: ReducerNode<S, A>): S => {
    if (typeof reducer === 'function') {
        return reducer(state, action);
    } else if (Array.isArray(reducer)) {
        for (const subReducer of reducer) {
            state = reduce(state, action, subReducer);
        }
        return state;
    } else if (Object.getPrototypeOf(reducer) === Object.prototype) {
        const changes: Partial<S> = {};
        let hasChanges = false;
        for (const prop of Object.keys(reducer)) {
            const next = reduce((state as any)[prop], action, (reducer as any)[prop]);
            if ((state as any)[prop] !== next) {
                hasChanges = true;
                (changes as any)[prop] = next;
            }
        }
        state = hasChanges ? {...state, ...changes} : state;
        return state;
    }
    return reducer as any;
}

export const combineReducers = <S, A>(...reducers: ReducerNode<S, A>[]): Reducer<S, A> => {
    return (state: S, action: A) => {
        return reduce(state, action, reducers);
    }
}