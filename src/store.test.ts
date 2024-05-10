import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {configure} from './configure';
import {Store} from './Store';

describe('store', () => {

    it('should throw if dispatch is called in reducer', () => {
        type A = {type: 'DO'}
        type S = {m: number}
        const {dispatch} = configure<S, A>({
            reducer: (s, a) => {
                dispatch({type: 'DO'});
                return s;
            },
            initialState: {
                m: 1
            }
        });
        expect(() => dispatch({type: 'DO'})).toThrow('Dispatch inside reducer is not allowed!');
    });

    describe('subscribe', () => {
        let store: Store<{}, any>
        beforeAll(() => {
            store = configure({
                reducer: (s, a) => s,
                initialState: {}
            });
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