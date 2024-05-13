import {configureStore} from './configureStore'

type DodoState = {mode: 'A' | 'B'};
type DodoAction = {type: 'init'};

const initialState: DodoState = {mode: 'A'};

const store = configureStore({
    reducer: (state: DodoState, action: DodoAction): DodoState => {
        switch (action.type) {
            case 'init':
                return {...state, mode: 'B'}
        }
        return state;
    },
    initialState
});

console.log('res.getState()', store.getState());

store.dispatch({type: 'init'});

console.log('res.getState()', store.getState());





