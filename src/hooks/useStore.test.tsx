import {act, render, renderHook, screen, waitFor} from '@testing-library/react';
import {FC, PropsWithChildren, useState} from 'react';
import {describe, expect, expectTypeOf, it} from 'vitest';
import {Store} from '../Store';
import {ReducerNode, configure} from '../configure';
import {StoreProvider} from './StoreContext';
import {useStore} from './useStore';
import {useStoreDispatch} from './useStoreDispatch';

type AppState = {
    mode: string
    user: {name: string, age: number}
};

type AppAction = {type: 'party'};

const initialState: AppState = {
    mode: 'initial',
    user: {name: 'Hans', age: 35}
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

const Providers: FC<PropsWithChildren> = ({children}) => {
    const [store] = useState(() => configure<AppState, AppAction>({
        reducer: appReducer,
        initialState,
    }));
    currentStore = store;
    return <StoreProvider store={store}>
        {children}
    </StoreProvider>;
}

describe('useStore', () => {

    it('should return initial state', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper: Providers, });
        expect(result.current.getState()).toStrictEqual(initialState);
    });

    it('should return updated state after dispatch', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper: Providers});
        result.current.dispatch({type: 'party'});
        expect(result.current.getState()).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender on dispatch', async () => {
        let count = 0;
        let store: Store<AppState, AppAction>;
        const Comp = () => {
            store = useStore<AppState, AppAction>();
            count++;
            const age = store.getState().user.age;
            console.log('render Comp ', age);
            return <div data-testid="comp">{age}</div>;
        }
        const result = render(<Comp />, {wrapper: Providers});
        expect((await screen.findByTestId('comp')).textContent).toBe('35');
        console.log('count', count);
        act(() => store!.dispatch({type: 'party'}));
        expect(store!.getState().user.age).toBe(36);
        console.log('count', count);
        await waitFor(async () => expect((await screen.findByTestId('comp')).textContent).toBe('36'));
    });

    // it.only('should trigger rerender on dispatch 2', async () => {
    //     let count = 0;
    //     let store: Store<AppState, AppAction>;
    //     const Comp = () => {
    //         console.log('render Comp()')
    //         store = useStore();
    //         count++;
    //         return store.getState().user.age;
    //     }
    //     const result = render(<Comp />, {wrapper: Providers});
    //     console.log('result', store!.getState(), count, result.baseElement.textContent);
    //     // await act(async () => {
    //     store!.dispatch({type: 'party'});
    //     // });
    //     console.log('result', store!.getState(), count, result.baseElement.textContent);
    // });


    // it.only('dasdqadqdwdwdewd', async () => {
    //     const {result} = renderHook(() => {
    //         const store = useStore<AppState, AppAction>();
    //         console.log('store', store);
    //         console.log('store.getState()', store.getState());
    //         return {
    //             state: store.getState(),
    //             dispatch: store.dispatch,
    //             age: store.getState().user.age,
    //         };
    //     }, {wrapper: Providers});
    //     console.log(result.current.age);
    //     act(() => {
    //         result.current.dispatch({type: 'party'});
    //     });
    //     await waitFor(() => {
    //         expect(result.current.age).toBe(36);
    //     }, {timeout: 2000});
    //     console.log(result.current.age);
    // });

    it.only('dasdqadqd', async () => {
        let dodo: any;
        let count = 0;
        const Comp = () => {
            const [age, setAge] = useState(30);
            dodo = setAge;
            console.log("render Comp");
            count++;
            return <div data-testid="dodo">{age}</div>
        }
        const result = render(<Comp></Comp>);
        console.log((await screen.findByTestId('dodo')).textContent);
        dodo(33);
        const element = await screen.findByTestId('dodo');
        console.log(element.textContent);
        console.log('count', count);
    });

})

describe('useStoreDispatch', () => {

    it('should return the dispatch function of the current store', () => {
        const {result} = renderHook(() => useStoreDispatch<AppAction>(), {wrapper: Providers});
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