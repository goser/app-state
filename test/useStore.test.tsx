import {act, render, renderHook, waitFor} from '@testing-library/react';
import {Dispatch, FC, PropsWithChildren, useState} from 'react';
import {describe, expect, expectTypeOf, it, test} from 'vitest';
import {StoreProvider} from '../src/hooks/StoreContext';
import {useDispatch} from '../src/hooks/useDispatch';
import {useSelector} from '../src/hooks/useSelector';
import {useStore} from '../src/hooks/useStore';
import {ReducerNode} from '../src/reducer/Reducer';
import {ExtractAction} from '../src/store/ExtractAction';
import {Store} from '../src/store/Store';

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
    listView: {
        show: boolean
        loading: boolean
        list: string[] | null
    }
};

type AppAction = {type: 'party'};

const initialState: AppState = {
    mode: 'initial',
    user: {name: 'Hans', age: 35},
    data: {
        a: 1
    },
    listView: {
        show: false,
        loading: false,
        list: null,
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

const createStore = () => Store
    .scope<AppState, AppAction>()
    .addReducer(appReducer)
    .addAsyncAction('showList', async () => Promise.resolve(['a', 'b', 'c']))
    .nested(s => s.listView, config => config
        .addCase('showList', (s, a) => ({...s, show: true}))
        .addCase('showList.loading', (s, a) => ({...s, loading: true}))
        .addCase('showList.done', (s, a) => ({...s, loading: false, list: a.data}))
        // TODO error case
    )
    .create(initialState);

// just a workaround to get the correct typing for useAppDispatch
let currentStore = createStore();

const wrapper: FC<PropsWithChildren> = ({children}) => {
    const [store] = useState(createStore);
    currentStore = store;
    return <StoreProvider store={store}>
        {children}
    </StoreProvider>;
}

const selectUser = (state: AppState) => state.user;
const selectData = (state: AppState) => state.data;

const useAppSelector = useSelector.scope<AppState>();
const useAppDispatch = useDispatch.scope<ExtractAction<typeof currentStore>>();

describe('useStore', () => {

    it('should return initial state and dispatch of currentStore', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper});
        expect(result.current.state).toStrictEqual(initialState);
        expect(result.current.dispatch).toStrictEqual(currentStore.dispatch);
    });

    it('should return updated state after dispatch', () => {
        const {result} = renderHook(() => useStore<AppState, AppAction>(), {wrapper});
        act(() => result.current.dispatch({type: 'party'}));
        expect(result.current.state).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender when state changed', () => {
        let count = 0;
        const Comp = () => {
            useStore();
            count++;
            return null;
        }
        render(<Comp />, {wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(count).toBe(2);
    });

});

describe('useSelector', () => {

    it('should return initial state', () => {
        const {result} = renderHook(() => useAppSelector(), {wrapper});
        expect(result.current).toStrictEqual(initialState);
    });

    it('should return updated state after dispatch', () => {
        const {result} = renderHook(() => useAppSelector(), {wrapper});
        act(() => currentStore.dispatch({type: 'party'}));
        expect(result.current).toStrictEqual(afterPartyState);
    });

    it('should trigger rerender on dispatch', () => {
        let count = 0;
        const Comp = () => {
            useAppSelector();
            count++;
            return null;
        }
        render(<Comp />, {wrapper});
        expect(count).toBe(1);
        act(() => currentStore.dispatch({type: 'party'}));
        expect(count).toBe(2);
    });

    it('should allow to select a substate', async () => {
        const {result} = renderHook(() => useAppSelector(s => s.data), {wrapper});
        await waitFor(() => expect(result.current).toStrictEqual(initialState.data));
    });

    it('should not trigger rerender when another substate was changed by dispatch', () => {
        let userRenderCount = 0;
        const UserComp = () => {
            useAppSelector(selectUser);
            userRenderCount++;
            return null;
        };
        let dataRenderCount = 0;
        const DataComp = () => {
            useAppSelector(selectData);
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

describe('useDispatch', () => {

    it('should return the dispatch function of the current store', () => {
        const {result} = renderHook(() => useAppDispatch(), {wrapper});
        expectTypeOf(result.current).toMatchTypeOf((action: AppAction) => { });
        expect(result.current).toStrictEqual(currentStore.dispatch);
    });

    it('should trigger rerender for global state and changed substates', () => {
        let dispatch: Dispatch<AppAction>;
        const Comp0 = () => {
            dispatch = useAppDispatch();
            return null;
        }
        let count1 = 0;
        const Comp1 = () => {
            useStore<AppState, AppAction>();
            count1++;
            return null;
        }
        let count2 = 0;
        const Comp2 = () => {
            useAppSelector((s) => s.user);
            count2++;
            return null;
        }
        let count3 = 0;
        const Comp3 = () => {
            useAppSelector((s) => s.data);
            count3++;
            return null;
        }
        render(<><Comp0 /><Comp1 /><Comp2 /><Comp3 /></>, {wrapper});
        expect(count1).toBe(1);
        expect(count2).toBe(1);
        expect(count3).toBe(1);
        act(() => dispatch({type: 'party'}));
        expect(count1).toBe(2);
        expect(count2).toBe(2);
        expect(count3).toBe(1);
    });

});

test('combined usage of hooks and async action', async () => {
    const List = () => {
        const list = useAppSelector(s => s.listView.list);
        return <div data-testid='list'>
            {list ? list.map(entry => <div data-testid='list-entry' key={entry}>{entry}</div>) : 'EMPTY'}
        </div>
    }
    const Loading = () => {
        const loading = useAppSelector(s => s.listView.loading);
        return <div data-testid='loading'>{loading ? 'loading' : 'idle'}</div>
    }
    const LoadButton = () => {
        const dispatch = useAppDispatch();
        return <button onClick={() => dispatch({type: 'showList'})} data-testid='load-button'>Load list</button>
    }
    const ListView = () => {
        const show = useAppSelector(s => s.listView.show);
        return <div>
            {show ? <div>LIST VIEW VISIBLE</div> : <div>LIST VIEW NOT VISIBLE</div>}
            <List />
            <Loading />
            <LoadButton />
        </div>
    }
    const result = render(<ListView />, {wrapper});
    expect(result.queryByText('LIST VIEW NOT VISIBLE')).not.toBeNull();
    expect(result.queryByTestId('list')?.textContent).toBe('EMPTY');
    expect(result.queryByTestId('loading')?.textContent).toBe('idle');
    act(() => result.queryByTestId('load-button')?.click());
    expect(result.queryByText('LIST VIEW VISIBLE')).not.toBeNull();
    expect(result.queryByTestId('loading')?.textContent).toBe('loading');
    expect(result.queryByTestId('list')?.textContent).toBe('EMPTY');
    await waitFor(() => {
        expect(result.queryByTestId('loading')?.textContent).toBe('idle');
        expect(result.queryByTestId('list')?.textContent).toBe('abc');
    });
});