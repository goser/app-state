export declare const useStore: <S, A>() => {
    dispatch: (action: A) => void;
    state: S;
};
