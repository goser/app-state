import {StoreSubscriber} from './StoreSubscriber'

export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
    subscribe: (subscriber: StoreSubscriber<S>) => void
    unsubscribe: (subscriber: StoreSubscriber<S>) => void
}