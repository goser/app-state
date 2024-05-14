import {act, render, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {GetActionFromAsyncState, configureStore, createAsyncReducer, createAsyncState} from '../configureStore';
import {StoreProvider} from './StoreContext';
import {useStore} from './useStore';
import {Reducer} from 'react';

const getData = createAsyncState('getData', async (queryData: string) => new Promise<string>(resolve => setTimeout(() => resolve('JO DATA'), 500)));


describe('async', () => {
    it('should work', async () => {
        type State = {loading: boolean, data?: string}

        // TODO return reducer
        // TODO generate Action Types
        // TODO map parameters to Action Props
        type Action = {type: 'send'} | {type: 'response', data: string} | GetActionFromAsyncState<typeof getData> | {type: 'getData2'};
        const getData2 = createAsyncReducer('getData2', async (queryData: string) => new Promise<string>(resolve => setTimeout(() => resolve('JO DATA'), 500)));
        const initialState = {loading: false};

        const store = configureStore<State, Action>({
            reducer: [
                getData2({
                    loading: (s, a) => ({...s, loading: true}),
                    done: (s, a) => ({...s, loading: false, data: a.data}),
                }),
                (s, a) => {
                    switch (a.type) {
                        case 'send': return {...s, loading: true};
                        case 'response': return {...s, loading: false, data: a.data};
                        case 'getData.loading': return {...s, loading: true};
                        case 'getData.done': return {...s, loading: false, data: a.type};
                    }
                    return s;
                }
            ],
            initialState
        });

        const Comp = () => {
            const {state, dispatch} = useStore<State, Action>();
            const {loading, data} = state;
            const onClick = () => {
                // dispatch({type: 'send'});
                // sendRequest().then(response => dispatch({type: 'response', data: response}));
                // getData("some query");
                dispatch({type: 'getData2'})
            };
            return <div>
                {loading && <div>IS LOADING</div>}
                {<div data-testid='data'>{data ? data : 'NO DATA'}</div>}
                <button onClick={onClick}>SEND</button>
            </div>;
        }
        const result = render(<StoreProvider store={store}><Comp /></StoreProvider>);
        expect(result.queryByText('IS LOADING')).toBeNull();
        expect((await result.findByTestId('data')).textContent).toBe('NO DATA');
        await act(() => result.findByText('SEND').then(b => b.click()));
        expect(result.queryByText('IS LOADING')).not.toBeNull();
        expect((await result.findByTestId('data')).textContent).toBe('NO DATA');
        await new Promise(res => setTimeout(() => res(null), 1000));
        await waitFor(async () => expect((await result.findByTestId('data')).textContent).toBe('JO DATA'))


    });
})