import {beforeAll, describe, expect, it, vi} from 'vitest';
import {Store} from './Store';
import {Configurator} from './Configurator';

describe('store', () => {

    it('should throw if dispatch is called in reducer', () => {
        type A = {type: 'DO'}
        type S = {m: number}
        const {dispatch} = Configurator.store<S, A>().addReducer((s, a) => {
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
            store = Configurator.store<{}, any>().addReducer((s, a) => s).create({})
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