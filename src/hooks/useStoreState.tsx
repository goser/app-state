import {useStore} from './useStore';

export const useStoreState = <S,>() => useStore<S, any>().getState();