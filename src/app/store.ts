import {useDispatch} from '../hooks/useDispatch';
import {useSelector} from '../hooks/useSelector';
import {configureStore} from '../store/configureStore';
import {ShowUserListAction, showUserListReducer} from './action/ShowUserListAction';

export type AppAction = ShowUserListAction

export type AppState = {
    userList: {
        show: boolean,
        loading: boolean,
        list: string[],
    }
}

const initialState: AppState = {
    userList: {
        show: false,
        list: [],
        loading: false,
    }
}

export const store = configureStore<AppState, AppAction>({
    reducer: [
        showUserListReducer,
        (s, a) => {
            return s;
        },
        {
            userList: (state, action) => {
                switch (action.type) {
                    case 'show-user-list':
                        return {...state, show: true}
                    case 'show-user-list.loading':
                        return {...state, loading: true}
                    case 'show-user-list.done':
                        return {...state, loading: false, list: action.data}
                }
                return state;
            }
        }
    ],
    initialState,
});

export const useAppDispatch = () => useDispatch<AppAction>();
export const useAppState = useSelector.wrap<AppState>()