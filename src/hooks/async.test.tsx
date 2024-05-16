import {act, cleanup, render, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {GetActionFromAsyncReducer, Loaders, configureStore, createAsyncReducer, createAsyncReducerFactory, createAsyncReducerObject, createStoreConfigurator} from '../configureStore';
import {StoreProvider} from './StoreContext';
import {useStore} from './useStore';
import {FC} from 'react';
import {Store} from '../Store';

const pause = (timeout = 1000) => new Promise<void>(resolve => setTimeout(() => resolve(), timeout));

describe('async', () => {

    afterEach(() => {
        cleanup();
    });

    describe('variants', () => {
        type State = {loading: boolean, data?: string, sub: {a: string}};

        let initialState: State;

        const RenderComp: FC<{onClick: () => void, state: State}> = ({onClick, state}) => {
            const {loading, data, sub} = state;
            return <div>
                {loading && <div>IS LOADING</div>}
                {sub.a && <div>{sub.a}</div>}
                {<div data-testid='data'>{data ? data : 'NO DATA'}</div>}
                <button onClick={() => onClick()}>SEND</button>
            </div>;
        }

        let Comp: FC;

        let store: any;

        beforeEach(() => {
            initialState = {loading: false, sub: {a: 'A'}};
        });

        it('variant 0', async () => {

            type Action = {type: 'something'} | {type: 'some'};

            const someRequest = async (params: {s: string, n: number}) => {
                await pause(50);
                return 'JO DATA';
            }

            const extendedStore = createStoreConfigurator<State, Action>()
                .addLoader('getData', someRequest)
                .addReducer((s, a) => {
                    switch (a.type) {
                        case 'getData.loading': return {...s, loading: true}
                        case 'getData.done':
                            return {...s, loading: false, data: a.data}
                    }
                    return s;
                })
                .create(initialState);

            type ExtendedActions = Parameters<(typeof extendedStore)['dispatch']>[0];
            store = extendedStore;

            Comp = () => {
                const {state, dispatch} = useStore<State, ExtendedActions>();
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData', params: {s: 'my query', n: 123}})} />;
            }
        });

        it('variant 1', async () => {
            const getDataReducer = createAsyncReducer('getData', async (params: {s: string, n: number}) => {
                await pause(50);
                return 'JO DATA';
            });

            type Action = {type: 'something'} | GetActionFromAsyncReducer<typeof getDataReducer>;

            store = configureStore<State, Action>({
                reducer: [
                    getDataReducer,
                    (s, a) => {
                        switch (a.type) {
                            case 'something': return s;
                            case 'getData.loading': return {...s, loading: true};
                            case 'getData.done': return {...s, loading: false, data: a.data};
                        }
                        return s;
                    },
                ],
                initialState
            });

            Comp = () => {
                const {state, dispatch} = useStore<State, Action>();
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData', params: {s: 'my query', n: 123}})} />;
            }
        });

        it('variant 2', async () => {
            type Action = {type: 'something'}
                | {type: 'getData', query: string};

            const getData = createAsyncReducerObject('getData', async (queryData: string) => {
                await pause(50);
                return 'JO DATA';
            });

            store = configureStore<State, Action>({
                reducer: [
                    getData({
                        loading: (s, a) => ({...s, loading: true}),
                        done: (s, a) => ({...s, loading: false, data: a.data}),
                    }),
                    (s, a) => {
                        switch (a.type) {
                            case 'something': return s;
                        }
                        return s;
                    }
                ],
                initialState
            });

            Comp = () => {
                const {state, dispatch} = useStore<State, Action>();
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData', query: 'my query'})} />;
            }
        });

        it('variant 3', async () => {
            type Action = {type: 'something'}
                | {type: 'getData', query: string, id: number};

            const factory = createAsyncReducerFactory<Action>()
            const getData3 = factory.create('getData', async (action) => {
                await pause(50);
                return 'JO DATA';
            });

            store = configureStore<State, Action>({
                reducer: [
                    getData3((s, a) => {
                        switch (a.type) {
                            case 'getData.loading':
                                return {...s, loading: true};
                            case 'getData.done':
                                return ({...s, loading: false, data: a.data});
                        }
                        return s;
                    }),
                    (s, a) => {
                        switch (a.type) {
                            case 'something': return s;
                        }
                        return s;
                    }
                ],
                initialState
            });

            Comp = () => {
                const {state, dispatch} = useStore<State, Action>();
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData', query: 'query me this', id: 1})} />;
            }
        });

        afterEach(async () => {
            const result = render(<StoreProvider store={store}><Comp /></StoreProvider>);
            expect(result.queryByText('IS LOADING')).toBeNull();
            expect((await result.findByTestId('data')).textContent).toBe('NO DATA');
            await act(() => result.findByText('SEND').then(b => b.click()));
            expect(result.queryByText('IS LOADING')).not.toBeNull();
            expect((await result.findByTestId('data')).textContent).toBe('NO DATA');
            await waitFor(async () => expect((await result.findByTestId('data')).textContent).toBe('JO DATA'))
        });

    });

})