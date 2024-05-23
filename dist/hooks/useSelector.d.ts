export interface UseSelector<State = unknown> {
    <S extends State = State, R = unknown>(selector: (state: S) => R): R;
    <S extends State = State, R = unknown>(): S;
    scope: <S extends State>() => UseSelector<S>;
}
export declare const useSelector: UseSelector<unknown>;
