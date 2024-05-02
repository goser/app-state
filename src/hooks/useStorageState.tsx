import {useStorageContext} from './StorageContext';

export const useStorageState = <S,>() => useStorageContext<S, any>().getState();