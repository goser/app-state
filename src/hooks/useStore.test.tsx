import {act, render, renderHook, waitFor} from '@testing-library/react';
import {FC, PropsWithChildren, useState} from 'react';
import {describe, expect, expectTypeOf, it} from 'vitest';
import {Store} from '../Store';
import {ReducerNode, configure} from '../configure';
import {StoreProvider} from './StoreContext';
import {useStoreDispatch} from './useStoreDispatch';
import {useStoreState} from './useStoreState';

type AppStateData = {
    a: number
};

type AppState = {
    mode: string
    user: {name: string, age: number}
    data: AppStateData
};

type AppAction = {type: 'party'};

const initialState: AppState = {
    mode: 'initial',
    user: {name: 'Hans', age: 35},
    data: {
        a: 1
    }
};

const afterPartyState: AppState = {...initialState, user: {...initialState.user, age: 36}};

const appReducer: ReducerNode<AppState, AppAction> = {
    user: (state, action) => {
        switch (action.type) {
            case 'party': return {...state, age: state.age + 1}
        }
        return state;
    }
};

let currentStore: Store<AppState, AppAction>;

const wrapper: FC<PropsWithChildren> = ({children}) => {
    const [store] = useState(() => configure<AppState, AppAction>({
        reducer: appReducer,
        initialState,
    }));
    currentStore = store;
    return <StoreProvider store={store}>
        {children}
    </StoreProvider>;
}

describe('useStoreState', () => {

    it('should return initial state', () => {
        const {result} = renderHook(() => useStoreState<AppState>(), {wrapper: wrapper, });
        expect(result.current).toStrictEqual(initialState);
    });

    it('should return updated state after dispatch', () => {
        let state: AppState;
        const Comp = () => {
            state = useStoreState<AppState>();
            return null;
        }
        render(<Comp />, {wrapper: wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(state!).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender on dispatch', () => {
        let count = 0;
        let state: AppState;
        const Comp = () => {
            state = useStoreState<AppState>();
            count++;
            return null;
        }
        render(<Comp />, {wrapper: wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(state!.user.age).toBe(36);
        expect(count).toBe(2);
        act(() => currentStore.dispatch({type: 'party'}));
        expect(state!.user.age).toBe(37);
        expect(count).toBe(3);
    });

    it('should allow to select a substate', async () => {
        const {result} = renderHook(() => useStoreState((s: AppState) => s.data), {wrapper});
        await waitFor(() => expect(result.current).toStrictEqual(initialState.data));

    });

    it('should not trigger rerender when another substate was changed by dispatch', () => {
        const selectUser = (state: AppState) => state.user;
        let userRenderCount = 0;
        const UserComp = () => {
            const user = useStoreState(selectUser);
            userRenderCount++;
            return null;
        };
        const selectData = (state: AppState) => state.data;
        let dataRenderCount = 0;
        const DataComp = () => {
            const data = useStoreState(selectData);
            dataRenderCount++;
            return null;
        };

        render(<><UserComp /><DataComp /></>, {wrapper});

        expect(userRenderCount).toBe(1);
        expect(dataRenderCount).toBe(1);
        act(() => currentStore.dispatch({type: 'party'}));

        expect(userRenderCount).toBe(2);
        expect(dataRenderCount).toBe(1);
    });

});

describe('useStoreDispatch', () => {

    it('should return the dispatch function of the current store', () => {
        const {result} = renderHook(() => useStoreDispatch<AppAction>(), {wrapper: wrapper});
        expectTypeOf(result.current).toMatchTypeOf((action: AppAction) => { });
        expect(result.current).toStrictEqual(currentStore.dispatch);
    });

    // it('should update state regardless of rerender', () => {
    //     const {result} = renderHook(() => useStoreDispatch<AppAction>(), {wrapper: Providers});
    //     expectTypeOf(result.current).toMatchTypeOf((action: AppAction) => { });
    //     expect(currentStore.getState()).toStrictEqual(initialState);
    //     result.current({type: 'party'});
    //     expect(currentStore.getState()).toStrictEqual(afterPartyState);
    // });

    // it('should update state for rerendered component', () => {
    //     const {result, rerender} = renderHook(() => {
    //         return {
    //             store: useStore<AppState, AppAction>(),
    //             dispatch: useStoreDispatch<AppAction>(),
    //         }
    //     }, {wrapper: Providers});
    //     expect(result.current.dispatch).toBe(result.current.store.dispatch);
    //     expect(result.current.store.getState()).toBe(initialState);
    //     result.current.dispatch({type: 'party'});
    //     rerender();
    //     expect(result.current.store.getState()).toStrictEqual(afterPartyState);
    // });

});