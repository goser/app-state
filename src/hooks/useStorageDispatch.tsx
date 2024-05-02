import {useStorageContext} from './StorageContext';

export const useStorageDispatch = <A,>() => useStorageContext<any, A>().dispatch;