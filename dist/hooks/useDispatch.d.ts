import { Dispatch } from 'react';
interface UseDispatch<Action = unknown> {
    <A extends Action>(): Dispatch<A>;
    scope: <A extends Action>() => UseDispatch<A>;
}
export declare const useDispatch: UseDispatch<unknown>;
export {};
