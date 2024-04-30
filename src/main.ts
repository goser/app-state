import {configure} from './configure'

type DodoState = {mode: 'A' | 'B'};
type DodoAction = {type: 'init'};

const initialState: DodoState = {mode: 'A'};

const res = configure({
    reducer: (state: DodoState, action: DodoAction): DodoState => {
        switch (action.type) {
            case 'init':
                return {...state, mode: 'B'}
        }
        return state;
    },
    initialState
});

console.log('res.getState()', res.getState());

res.dispatch({type: 'init'});

console.log('res.getState()', res.getState());





