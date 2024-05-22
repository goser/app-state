import {Dispatch} from 'react';
import {useStoreContext} from './StoreContext';

interface UseDispatch<Action = unknown> {

    <A extends Action>(): Dispatch<A>

    scope: <A extends Action>() => UseDispatch<A>
}

const useDispatchIntern = <A,>() => useStoreContext<any, A>().store.dispatch;

Object.assign(useDispatchIntern, {
    scope: () => useDispatchIntern
});

export const useDispatch = useDispatchIntern as UseDispatch
