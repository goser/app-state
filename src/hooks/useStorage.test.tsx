import {Component, Dispatch, FC, PropsWithChildren, ReactNode, useEffect, useState} from 'react';
import {beforeEach, describe, expect, it} from 'vitest';
import {useStorage} from './useStorage';
import {render, renderHook} from '@testing-library/react'
import {StorageContextProvider, getStorageContext} from './StorageContext';
import {Reducer, ReducerNode, Store, configure} from '../configure';
import {useStorageState} from './useStorageState';
import {useStorageDispatch} from './useStorageDispatch';

type AppState = {
    mode: string
    user: {name: string, age: number}
};

type AppAction = {type: 'party'};

const initialState: AppState = {
    mode: 'initial',
    user: {name: 'Hans', age: 35}
};

const appReducer: ReducerNode<AppState, AppAction> = {
    user: (state, action) => {
        switch (action.type) {
            case 'party': return {...state, age: state.age + 1}
        }
        return state;
    }
};

const store = configure<AppState, AppAction>({
    reducer: appReducer,
    initialState,
});
getStorageContext<AppState, AppAction>().store = store;

const WithStorage: FC<PropsWithChildren> = ({children}) => {
    return <StorageContextProvider>
        {children}
    </StorageContextProvider>;
}

describe('useStorage', () => {

    it('should return initial state', () => {
        let store: Store<AppState, AppAction>;
        const Component: FC = () => {
            store = useStorage<AppState, AppAction>();
            return null;
        };
        render(<StorageContextProvider><Component /></StorageContextProvider>);
        expect(store!.getState()).toStrictEqual(initialState);
    });

})

describe('useStorageState', () => {

    it.only('should current state of storage', () => {
        let state: AppState;
        let dispatch: Dispatch<AppAction>;
        const Component: FC = () => {
            state = useStorageState<AppState>();
            console.log("render component", state);
            dispatch = useStorageDispatch();
            return null;
        }
        const result = render(<StorageContextProvider><Component /></StorageContextProvider>);
        expect(state!).toStrictEqual(initialState);

        dispatch!({type: 'party'});

        // expect(state!).toStrictEqual(initialState);
        result.rerender(<StorageContextProvider><Component /></StorageContextProvider>);

        // expect(state!).toStrictEqual(initialState);
    });

});