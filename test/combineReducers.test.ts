import {describe, expect, it} from 'vitest';
import {combineReducers} from '../src/reducer/combineReducers';

describe('combineReducers', () => {

    it('should allow to combine multiple reducer methods', () => {
        type Action = 'upper_case' | 'lower_case' | 'wave_case';
        const reducer = combineReducers<string, Action, string>(
            (s, a) => a === 'upper_case' ? s.toUpperCase() : s,
            (s, a) => a === 'lower_case' ? s.toLowerCase() : s,
            (s, a) => a === 'wave_case' ? s.split('').map((s, i) => i % 2 === 0 ? s.toLowerCase() : s.toUpperCase()).join('') : s,
        );
        let state = 'Nice Words';
        state = reducer(state, 'upper_case', state);
        expect(state).toBe('NICE WORDS');
        state = reducer(state, 'lower_case', state);
        expect(state).toBe('nice words');
        state = reducer(state, 'wave_case', state);
        expect(state).toBe('nIcE WoRdS');
    });

    it('should allow to combine multiple reducer maps', () => {
        type User = {
            name: string
            age: number
            working: boolean
        }
        type Action = {type: 'party'} | {type: 'rename', newName: string} | {type: 'fire'};
        const reducer = combineReducers<User, Action, User>(
            {name: (s: string, a: Action) => a.type === 'rename' ? a.newName : s},
            {age: (s: number, a: Action) => a.type === 'party' ? s + 1 : s},
            {working: (s: boolean, a: Action) => a.type === 'fire' ? false : s},
        );
        let user: User = {
            name: 'Heinz Möbelkunde',
            age: 33,
            working: true,
        };
        user = reducer(user, {type: 'rename', newName: 'Nubsi'}, user);
        expect(user).toStrictEqual({name: 'Nubsi', age: 33, working: true});
        user = reducer(user, {type: 'party'}, user);
        expect(user).toStrictEqual({name: 'Nubsi', age: 34, working: true});
        user = reducer(user, {type: 'fire'}, user);
        expect(user).toStrictEqual({name: 'Nubsi', age: 34, working: false});
    });

    it('should allow to combine multiple reducer maps and methods', () => {
        type App = {
            mode: 'active' | 'inactive',
            queue: any[],
            gobbly: {
                isLoading: boolean
            }
        }
        type Action = {type: 'toggle'} | {type: 'append', data: any} | {type: 'load'};
        const reducer = combineReducers<App, Action, App>(
            {mode: (s, a) => a.type === 'toggle' ? (s === 'active' ? 'inactive' : 'active') : s},
            (s, a) => a.type === 'append' ? ({...s, queue: [...s.queue, a.data]}) : s,
            {
                gobbly: {
                    isLoading: (s, a) => a.type === 'load' ? true : s
                }
            }
        );
        let app: App = {
            mode: 'inactive',
            queue: [],
            gobbly: {isLoading: false}
        }
        app = reducer(app, {type: 'toggle'}, app);
        expect(app).toStrictEqual({mode: 'active', queue: [], gobbly: {isLoading: false}});
        app = reducer(app, {type: 'append', data: 123}, app);
        expect(app).toStrictEqual({mode: 'active', queue: [123], gobbly: {isLoading: false}});
        app = reducer(app, {type: 'load'}, app);
        expect(app).toStrictEqual({mode: 'active', queue: [123], gobbly: {isLoading: true}});
    });

    it('should allow to pass arrays of reducers', () => {
        type Action = 'upper_case' | 'lower_case' | 'wave_case';
        const reducer = combineReducers<string, Action, string>(
            [
                (s, a) => a === 'upper_case' ? s.toUpperCase() : s,
                (s, a) => a === 'lower_case' ? s.toLowerCase() : s,
            ],
            (s, a) => a === 'wave_case' ? s.split('').map((s, i) => i % 2 === 0 ? s.toLowerCase() : s.toUpperCase()).join('') : s,
        );
        let state = 'Nice Words';
        state = reducer(state, 'upper_case', state);
        expect(state).toBe('NICE WORDS');
        state = reducer(state, 'lower_case', state);
        expect(state).toBe('nice words');
        state = reducer(state, 'wave_case', state);
        expect(state).toBe('nIcE WoRdS');
    });

    it('should call all reducers based on declaration order', () => {
        const reducer = combineReducers<number[], any, number[]>(
            (s, a) => ([...s, 1]),
            (s, a) => ([...s, 2]),
            (s, a) => ([...s, 3])
        );
        let calls: number[] = [];
        calls = reducer(calls, 'do', calls);
        expect(calls).toStrictEqual([1, 2, 3]);
    });
});