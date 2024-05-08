import {useStoreContext} from './StoreContext'

export const useStore = <T, A>() => useStoreContext<T, A>().store;