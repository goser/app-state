import {useStoreContext} from './StoreContext';

export const useStoreDispatch = <A,>() => useStoreContext<any, A>().store.dispatch;