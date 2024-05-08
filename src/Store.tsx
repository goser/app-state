export type Store<S = any, A = any> = {
    getState: () => S
    dispatch: (action: A) => void
}