import {act, render, renderHook, waitFor} from '@testing-library/react';
import {Dispatch, FC, PropsWithChildren, useState} from 'react';
import {describe, expect, expectTypeOf, it} from 'vitest';
import {Store} from '../Store';
import {ReducerNode, configure} from '../configure';
import {StoreProvider} from './StoreContext';
import {useStoreDispatch} from './useStoreDispatch';
import {useStoreState} from './useStoreState';
import {useStore} from './useStore';

type AppStateUser = {
    name: string,
    age: number
}

type AppStateData = {
    a: number
};

type AppState = {
    mode: string
    user: AppStateUser
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

const selectUser = (state: AppState) => state.user;
const selectData = (state: AppState) => state.data;

describe('useStore', () => {

    it('should return initial state and dispatch of currentStore', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper});
        expect(result.current.getState()).toStrictEqual(initialState);
        expect(result.current.dispatch).toStrictEqual(currentStore.dispatch);
    });

    it('should return updated state after dispatch', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper});
        act(() => result.current.dispatch({type: 'party'}));
        expect(result.current.getState()).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender when state changed', () => {
        let store: Store<AppState, AppAction>;
        let count = 0;
        const Comp = () => {
            store = useStore();
            count++;
            return null;
        }
        render(<Comp />, {wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(count).toBe(2);
    });

});

describe('useStoreState', () => {

    it('should return initial state', () => {
        const {result} = renderHook(() => useStoreState<AppState>(), {wrapper});
        expect(result.current).toStrictEqual(initialState);
    });

    it('should return updated state after dispatch', () => {
        const {result} = renderHook(() => useStoreState<AppState>(), {wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(result.current).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender on dispatch', () => {
        let count = 0;
        let state: AppState;
        const Comp = () => {
            state = useStoreState<AppState>();
            count++;
            return null;
        }
        render(<Comp />, {wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(count).toBe(2);
    });

    it('should allow to select a substate', async () => {
        const {result} = renderHook(() => useStoreState((s: AppState) => s.data), {wrapper});
        await waitFor(() => expect(result.current).toStrictEqual(initialState.data));
    });

    it('should not trigger rerender when another substate was changed by dispatch', () => {
        let userRenderCount = 0;
        const UserComp = () => {
            const user = useStoreState(selectUser);
            userRenderCount++;
            return null;
        };
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
        const {result} = renderHook(() => useStoreDispatch<AppAction>(), {wrapper});
        expectTypeOf(result.current).toMatchTypeOf((action: AppAction) => { });
        expect(result.current).toStrictEqual(currentStore.dispatch);
    });

    it('should trigger rerender for global state and changed substates', () => {
        let dispatch: Dispatch<AppAction>;
        const Comp0 = () => {
            dispatch = useStoreDispatch<AppAction>();
            return null;
        }
        let store: Store<AppState, AppAction>;
        let count1 = 0;
        const Comp1 = () => {
            store = useStore<AppState, AppAction>();
            count1++;
            return null;
        }
        let user: AppStateUser;
        let count2 = 0;
        const Comp2 = () => {
            user = useStoreState((s: AppState) => s.user);
            count2++;
            return null;
        }
        render(<><Comp0 /><Comp1 /><Comp2 /></>, {wrapper});
        expect(count1).toBe(1);
        expect(count2).toBe(1);
        act(() => dispatch({type: 'party'}));
        expect(count1).toBe(2);
        expect(count2).toBe(2);


    });

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