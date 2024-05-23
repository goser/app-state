export type StoreSubscriber<S> = (previousState: S, currentState: S) => void;
