export type StoreSubscriber = () => void

export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
    subscribe: (subscriber: StoreSubscriber) => void
    unsubscribe: (subscriber: StoreSubscriber) => void
}