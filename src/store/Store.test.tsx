import {waitFor} from '@testing-library/react';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import {Store} from './Store';

// helper
export const pause = (timeout = 1000) => new Promise<void>(resolve => setTimeout(() => resolve(), timeout));

describe('Store', () => {

    it('should support simple root reducers', () => {
        type S = {prop: string}
        type A = {type: 't'}
        const initial = {prop: 'A'}
        const store = Store
            .scope<S, A>()
            .addReducer((s, a) => a.type === 't' ? {...s, prop: 'B'} : s)
            .create(initial);
        expect(store.getState()).toStrictEqual({prop: 'A'});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({prop: 'B'});
    });

    it('should support nested reducers', () => {
        type S = {nested: {prop: string}}
        type A = {type: 't'}
        const initial = {nested: {prop: 'A'}}
        const store = Store
            .scope<S, A>()
            .addReducer(s => s.nested, (s, a) => a.type === 't' ? {...s, prop: 'B'} : s)
            .create(initial);
        expect(store.getState()).toStrictEqual({nested: {prop: 'A'}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({nested: {prop: 'B'}});
    });

    it('should support deep nested reducers', () => {
        type S = {deep: {nested: {prop: string}}}
        type A = {type: 't'}
        const initial = {deep: {nested: {prop: 'A'}}}
        const store = Store
            .scope<S, A>()
            .addReducer(s => s.deep.nested, (s, a) => a.type === 't' ? {...s, prop: 'B'} : s)
            .create(initial);
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'A'}}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'B'}}});
    });

    it('should support nested configuration', () => {
        type S = {nested: {prop: string}}
        type A = {type: 't'}
        const initial = {nested: {prop: 'A'}}
        const store = Store
            .scope<S, A>()
            .nested(s => s.nested, config => config.addReducer((s, a) => a.type === 't' ? {...s, prop: 'B'} : s))
            .create(initial);
        expect(store.getState()).toStrictEqual({nested: {prop: 'A'}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({nested: {prop: 'B'}});
    });

    it('should support deep nested configuration', () => {
        type S = {deep: {nested: {prop: string}}}
        type A = {type: 't'}
        const initial = {deep: {nested: {prop: 'A'}}}
        const store = Store
            .scope<S, A>()
            .nested(s => s.deep.nested, config => config.addReducer((s, a) => a.type === 't' ? {...s, prop: 'B'} : s))
            .create(initial);
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'A'}}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'B'}}});
    });

    it('should support nested nested configuration', () => {
        type S = {deep: {nested: {prop: string}}}
        type A = {type: 't'}
        const initial = {deep: {nested: {prop: 'A'}}}
        const store = Store
            .scope<S, A>()
            .nested(s => s.deep, config => config.nested(s => s.nested, config => config.addReducer((s, a) => a.type === 't' ? {...s, prop: 'B'} : s)))
            .create(initial);
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'A'}}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({deep: {nested: {prop: 'B'}}});
    });

    it('should support nested nested configuration for simple values', () => {
        type S = {prop: string}
        type A = {type: 't'}
        const initial = {prop: 'A'}
        const store = Store
            .scope<S, A>()
            .nested(s => s.prop, config => config.addReducer((s, a) => a.type === 't' ? 'B' : s))
            .create(initial);
        expect(store.getState()).toStrictEqual({prop: 'A'});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({prop: 'B'});
    });

    it('should support cases', () => {
        type S = {prop: string}
        type A = {type: 't'}
        const initial = {prop: 'A'}
        const store = Store
            .scope<S, A>()
            .addCase('t', (s, a) => ({...s, prop: 'B'}))
            .create(initial);
        expect(store.getState()).toStrictEqual({prop: 'A'});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({prop: 'B'});
    });

    it('should support cases on nested configurations', () => {
        type S = {nested: {prop: string}}
        type A = {type: 't'}
        const initial = {nested: {prop: 'A'}}
        const store = Store
            .scope<S, A>()
            .nested(s => s.nested, config => config.addCase('t', (s, a) => ({...s, prop: 'B'})))
            .create(initial);
        expect(store.getState()).toStrictEqual({nested: {prop: 'A'}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({nested: {prop: 'B'}});
    });

    it('should support cases for simple values', () => {
        type S = string;
        type A = {type: 't'}
        const initial = 'A'
        const store = Store
            .scope<S, A>()
            .addCase('t', () => 'B')
            .create(initial);
        expect(store.getState()).toStrictEqual('A');
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual('B');
    });

    it('should support cases for simple values on nested configurations', () => {
        type S = {nested: {prop: string}}
        type A = {type: 't'}
        const initial = {nested: {prop: 'A'}}
        const store = Store
            .scope<S, A>()
            .nested(s => s.nested.prop, config => config.addCase('t', () => 'B'))
            .create(initial);
        expect(store.getState()).toStrictEqual({nested: {prop: 'A'}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({nested: {prop: 'B'}});
    });

    it('should support async actions', async () => {
        type S = {prop: string}
        type A = {type: 't'}
        const initial = {prop: 'A'}
        const executedActions: string[] = [];
        const store = Store
            .scope<S, A>()
            .addAsyncAction('ta', async () => {
                await pause(100);
                return 'C'
            })
            .addReducer((s, a) => {
                executedActions.push(a.type);
                switch (a.type) {
                    case 'ta':
                        return s;
                    case 'ta.loading':
                        return {...s, prop: 'B'};
                    case 'ta.done':
                        return {...s, prop: a.data};
                }
                return s;
            })
            .create(initial);
        expect(store.getState()).toStrictEqual({prop: 'A'});
        store.dispatch({type: 'ta'});
        expect(store.getState()).toStrictEqual({prop: 'B'});
        await waitFor(() => expect(store.getState()).toStrictEqual({prop: 'C'}));
        expect(executedActions).toStrictEqual(['ta', 'ta.loading', 'ta.done']);
    });

    it('should map loader params to async action', async () => {
        type S = {a: string | null, b: string, c: {name: string, age: number}}
        type A = {type: 't'}
        const initial = {a: 'a', b: 'b', c: {name: 'c', age: 0}}
        const store = Store
            .scope<S, A>()
            .addAsyncAction('a', async () => null)
            .addCase('a.done', (s, a) => ({...s, a: a.data}))
            .addAsyncAction('b', async (name: string) => name)
            .addCase('b.done', (s, a) => ({...s, b: a.data}))
            .addAsyncAction('c', async (name: string, age: number) => ({name, age}))
            .addCase('c.done', (s, a) => ({...s, c: a.data}))
            .create(initial);
        expect(store.getState()).toStrictEqual(initial);
        store.dispatch({type: 'a'});
        store.dispatch({type: 'b', params: ['Heinz']});
        await waitFor(() => expect(store.getState()).toStrictEqual({a: null, b: 'Heinz', c: {name: 'c', age: 0}}));
    });

    it('should throw if dispatch is called in reducer', () => {
        type A = {type: 'DO'}
        type S = {m: number}
        const {dispatch} = Store.scope<S, A>().addReducer((s, a) => {
            dispatch({type: 'DO'});
            return s;
        }).create({
            m: 1
        });
        expect(() => dispatch({type: 'DO'})).toThrow('Dispatch inside reducer is not allowed!');
    });

    describe('subscribe', () => {
        let store: Store<{}, any>

        beforeAll(() => {
            store = Store.scope<{}, any>().addReducer((s, a) => s).create({})
        });

        it('should call subscriber when dispatch was done', () => {
            const subscriber = vi.fn();
            store.subscribe(subscriber);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(1);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(2);
        });

        it('should don\'t call unsubscribed subscriber', () => {
            const subscriber = vi.fn();
            store.subscribe(subscriber);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(1);
            store.unsubscribe(subscriber);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(1);
        });

        it('should allow each subscriber only once', () => {
            const subscriber = vi.fn();
            store.subscribe(subscriber);
            store.subscribe(subscriber);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(1);
            store.subscribe(subscriber);
            store.dispatch(1);
            expect(subscriber).toBeCalledTimes(2);
        });
    });

});