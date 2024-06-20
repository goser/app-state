import {NestedReducer, ReducerNode} from './Reducer';

const reduce = <S, A, R>(state: S, action: A, reducer: ReducerNode<S, A, R>, root: R): S => {
    if (typeof reducer === 'function') {
        return reducer(state, action, root);
    } else if (Array.isArray(reducer)) {
        for (const subReducer of reducer) {
            state = reduce(state, action, subReducer, root);
        }
        return state;
    } else if (Object.getPrototypeOf(reducer) === Object.prototype) {
        const changes: Partial<S> = {};
        let hasChanges = false;
        for (const prop of Object.keys(reducer)) {
            const next = reduce((state as any)[prop], action, (reducer as any)[prop], root);
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

export function combineReducers<S, A, R>(...reducers: ReducerNode<S, A, R>[]): NestedReducer<S, A, R> {
    return (state: S, action: A, root: R) => {
        return reduce(state, action, reducers, root);
    }
}