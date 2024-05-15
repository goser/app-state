import {act, cleanup, render, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {GetActionFromAsyncReducer, configureStore, createAsyncReducer, createAsyncReducerFactory, createAsyncReducerObject} from '../configureStore';
import {StoreProvider} from './StoreContext';
import {useStore} from './useStore';
import {FC} from 'react';

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
                | {type: 'getData2', query: string};

            const getData2 = createAsyncReducerObject('getData2', async (queryData: string) => {
                await pause(50);
                return 'JO DATA';
            });

            store = configureStore<State, Action>({
                reducer: [
                    getData2({
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
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData2', query: 'my query'})} />;
            }
        });
        it('variant 3', async () => {
            type Action = {type: 'something'}
                | {type: 'getData3', query: string, id: number};

            const factory = createAsyncReducerFactory<Action>()
            const getData3 = factory.create('getData3', async (action) => {
                await pause(50);
                return 'JO DATA';
            });

            store = configureStore<State, Action>({
                reducer: [
                    getData3((s, a) => {
                        switch (a.type) {
                            case 'getData3.loading':
                                return {...s, loading: true};
                            case 'getData3.done':
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
                return <RenderComp state={state} onClick={() => dispatch({type: 'getData3', query: 'query me this', id: 1})} />;
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