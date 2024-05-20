import {findByTestId} from '@testing-library/react';
import {describe, it} from 'vitest';
import {Reducer} from '../reducer/Reducer';
import {TypedAction} from '../store/TypedAction';

describe('func', () => {
    it('arg count test', () => {
        const testFunc = (input: any) => {
            if (typeof input === 'function') {
                console.log('function', input.length)
            } else if (Array.isArray(input)) {
                console.log('array');
            } else if (typeof input === 'object') {
                console.log('map');
            }
        }

        testFunc((state: any, action: any) => { });
        testFunc((config: any) => { })
        testFunc([]);
        testFunc({});
    });

    const createPathResolvingProxy = <S extends Object>(state: S, path: (string | symbol)[]): S => {
        return new Proxy(state, {
            get(target, p) {
                path.push(p);
                const value = (target as any)[p];
                if (typeof value === 'object' && value !== null && value !== undefined) {
                    return createPathResolvingProxy(value, path);
                }
                return value;
            },
        }) as any;
    };

    const reduceByPath = (state: any, path: (string | symbol)[], newValueProvider: () => any): any => {
        if (path.length === 0) {
            return newValueProvider();
        }
        const key = path.shift()!;
        return {...state, [key]: reduceByPath(state[key], path, newValueProvider)}
    }

    const deepDive = <S extends Object, R = unknown>(state: S, selector: (s: S) => R, subReducer: (s: R) => R) => {
        const path: (string | symbol)[] = [];

        const proxy = createPathResolvingProxy(state, path);
        const subState = selector(proxy);

        console.log('subState', subState);
        console.log('path', path);

        return reduceByPath(state, path, () => subReducer(subState));
    }


    it.only('selector', () => {
        const state = {
            str0: 'ABC',
            nul0: null,
            und0: undefined,
            num0: 1,
            boo0: false,
            level1: {
                str1: 'ABC',
                level2: {
                    level3: {
                        str2: 'ABC',
                        num: 123,
                        arr: []

                    }
                }
            }
        };

        console.log('state', state);

        const selector = (s: typeof state) => s.level1.str1;

        const action = {type: 'some'};

        const newState = deepDive(state, selector, (s) => {
            return 'NARF';
        });

        console.log('newState', JSON.stringify(newState, undefined, '  '));

    });
});
