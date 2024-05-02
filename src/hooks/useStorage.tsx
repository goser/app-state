import {useStorageContext} from './StorageContext'

export const useStorage = <T, A>() => useStorageContext<T, A>();