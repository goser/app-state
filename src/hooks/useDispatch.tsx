import {useStoreContext} from './StoreContext';

export const useDispatch = <A,>() => useStoreContext<any, A>().store.dispatch;