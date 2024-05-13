import {describe, expect, it, test} from 'vitest';
import {configure} from './configure';

describe('configure', () => {

    it('should allow single reducer function', () => {
        type S = {mode: 'A' | 'B'};
        type A = {type: 'init'};
        const store = configure<S, A>({
            reducer: (state, action) => {
                switch (action.type) {
                    case 'init':
                        return {...state, mode: 'B'}
                }
            },
            initialState: {mode: 'A'}
        });
        expect(store.getState()).toStrictEqual({mode: 'A'});
        store.dispatch({type: 'init'});
        expect(store.getState()).toStrictEqual({mode: 'B'});
    });

    it('should allow sub reducers for single properties', () => {
        type S = {age: number};
        type A = {type: 'birthday'};
        const store = configure<S, A>({
            reducer: {
                age: (s, a) => {
                    switch (a.type) {
                        case 'birthday':
                            return s + 1;
                    }
                    return s;
                }
            },
            initialState: {
                age: 15
            }
        });
        expect(store.getState()).toStrictEqual({age: 15});
        store.dispatch({type: 'birthday'});
        expect(store.getState()).toStrictEqual({age: 16});
    });

    it('should allow sub reducers for object properties', () => {
        type S = {user: {name: string, age: number}};
        type A = {type: 'birthday'};
        const store = configure<S, A>({
            reducer: {
                user: (s, a) => {
                    switch (a.type) {
                        case 'birthday':
                            return {...s, age: s.age + 1};
                    }
                    return s;
                }
            },
            initialState: {
                user: {
                    name: 'Heinz',
                    age: 66
                }
            }
        });
        expect(store.getState()).toStrictEqual({user: {name: 'Heinz', age: 66}});
        store.dispatch({type: 'birthday'});
        expect(store.getState()).toStrictEqual({user: {name: 'Heinz', age: 67}});
    });

    it('should support root reducers on different levels', () => {
        type S = {
            mode: string,
            user: {name: string, age: number}
        };
        type A = {type: 'birthday'} | {type: 'set_mode', value: string};
        const store = configure<S, A>({
            reducer: {
                reducer: (s, a) => {
                    switch (a.type) {
                        case 'set_mode':
                            return {...s, mode: a.value};
                    }
                    return s;
                },
                user: (s, a) => {
                    switch (a.type) {
                        case 'birthday':
                            return {...s, age: s.age + 1};
                    }
                    return s;
                }
            },
            initialState: {
                mode: 'initial',
                user: {name: 'Acorn', age: 3}
            }
        });

        expect(store.getState()).toStrictEqual({
            mode: 'initial',
            user: {name: 'Acorn', age: 3}
        });

        store.dispatch({type: 'set_mode', value: 'done'});
        expect(store.getState()).toStrictEqual({
            mode: 'done',
            user: {name: 'Acorn', age: 3}
        });
    });

    it('should allow fixed properties', () => {
        class Mode {
            constructor(public a: string, public b: string) {
            }
        }
        type S = {
            mode: {a: string, b: string},
            special: Mode,
            user: {name: string, age: number}
        }
        type A = {type: 'birthday'}
        const initialSpecial = new Mode('init', 'init');
        const fixedSpecial = new Mode("fix", "fix");
        const store = configure<S, A>({
            reducer: {
                mode: {a: "fixed", b: "fixed"},
                special: fixedSpecial,
                user: (s, a) => {
                    switch (a.type) {
                        case 'birthday':
                            return {...s, age: s.age + 1};
                    }
                    return s;
                }
            },
            initialState: {
                mode: {a: 'initial', b: 'initial'},
                special: initialSpecial,
                user: {name: 'Anne', age: 20}
            }
        });

        expect(store.getState()).toStrictEqual({
            mode: {a: 'initial', b: 'initial'},
            special: new Mode('init', 'init'),
            user: {name: 'Anne', age: 20}
        });
        expect(store.getState().special).toBe(initialSpecial);

        store.dispatch({type: 'birthday'});

        expect(store.getState()).toStrictEqual({
            mode: {a: 'fixed', b: 'fixed'},
            special: new Mode('fix', 'fix'),
            user: {name: 'Anne', age: 21}
        });
        expect(store.getState().special).toBe(fixedSpecial);
    });

    it('should support deep reducer nesting', () => {
        type S = {
            a: {age: number},
            b: {name: string},
            c: {
                d: {
                    info: string
                },
                additionalData?: any
            },
            e: {f: string},
        };
        type A =
            {type: 'doA'} |
            {type: 'doB'} |
            {type: 'update_info', value: string} |
            {type: 'add_info', value: any};

        const store = configure<S, A>({
            reducer: {
                a: (state, action) => {
                    switch (action.type) {
                        case 'doA':
                            return {...state, age: 456}
                    }
                    return state;
                },
                b: (state, action) => {
                    switch (action.type) {
                        case 'doB':
                            return {...state, name: 'BBB'}
                    }
                    return state;
                },
                c: {
                    reducer: (s, a) => {
                        switch (a.type) {
                            case 'add_info':
                                return {...s, additionalData: a.value}
                        }
                        return s;
                    },
                    d: (state, action) => {
                        switch (action.type) {
                            case 'update_info':
                                return {...state, info: action.value};
                        }
                        return state;
                    }
                },
                e: {f: (s, a) => s}
            },
            initialState: {
                a: {age: 123},
                b: {name: 'AAA'},
                c: {d: {info: 'no info'}},
                e: {f: 'hui'}
            }
        });

        expect(store.getState()).toStrictEqual({
            a: {age: 123},
            b: {name: 'AAA'},
            c: {d: {info: 'no info'}},
            e: {f: 'hui'}
        })

        store.dispatch({type: 'doA'});

        expect(store.getState()).toStrictEqual({
            a: {age: 456},
            b: {name: 'AAA'},
            c: {d: {info: 'no info'}},
            e: {f: 'hui'}
        });

        store.dispatch({type: 'update_info', value: 'Holla die Waldfee'});

        expect(store.getState()).toStrictEqual({
            a: {age: 456},
            b: {name: 'AAA'},
            c: {d: {info: 'Holla die Waldfee'}},
            e: {f: 'hui'}
        });

        store.dispatch({type: 'add_info', value: {what: 'why?'}})

        expect(store.getState()).toStrictEqual({
            a: {age: 456},
            b: {name: 'AAA'},
            c: {d: {info: 'Holla die Waldfee'}, additionalData: {what: 'why?'}},
            e: {f: 'hui'}
        });

    });

});
