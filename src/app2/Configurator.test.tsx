import {waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {pause} from '../pause';
import {Configurator} from './Configurator';

describe('Configurator', () => {

    it('should support simple root reducers', () => {
        type S = {prop: string}
        type A = {type: 't'}
        const initial = {prop: 'A'}
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
            .addCase('t', (s, a) => s.prop = 'B')
            .create(initial);
        expect(store.getState()).toStrictEqual({prop: 'A'});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({prop: 'B'});
    });

    it('should support cases on nested configurations', () => {
        type S = {nested: {prop: string}}
        type A = {type: 't'}
        const initial = {nested: {prop: 'A'}}
        const store = Configurator
            .store<S, A>()
            .nested(s => s.nested, config => config.addCase('t', (s, a) => s.prop = 'B'))
            .create(initial);
        expect(store.getState()).toStrictEqual({nested: {prop: 'A'}});
        store.dispatch({type: 't'});
        expect(store.getState()).toStrictEqual({nested: {prop: 'B'}});
    });

    it('should support cases for simple values', () => {
        type S = string;
        type A = {type: 't'}
        const initial = 'A'
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
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
        const store = Configurator
            .store<S, A>()
            .addAsyncAction('ta', async () => {
                await pause(100);
                return 'C'
            })
            .addReducer((s, a) => {
                switch (a.type) {
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
    });

});