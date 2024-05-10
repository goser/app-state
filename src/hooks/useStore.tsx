import {useStoreContext} from './StoreContext'
import {useStoreDispatch} from './useStoreDispatch';
import {useStoreState} from './useStoreState';

export const useStore = <S, A>() => {
    return {
        state: useStoreState<S>(),
        dispatch: useStoreDispatch<A>()
    }
};