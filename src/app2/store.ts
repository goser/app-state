import {useDispatch} from '../hooks/useDispatch';
import {useSelector} from '../hooks/useSelector';
import {pause} from '../pause';
import {ExtractAction} from '../store/ExtractAction';
import {Configurator} from './Configurator';

type BaseAction = {type: 'some-action'}

export type AppState = {
    userList: {
        show: boolean,
        loading: boolean,
        list: string[],
        wording: () => string,
    }
}

const initialState: AppState = {
    userList: {
        show: false,
        list: [],
        loading: false,
        wording: () => 'test'
    }
}

const loadUserList = async () => {
    await pause();
    return [
        'Hans Meiser',
        'Julia Funk',
        'Mark Rober',
        'Fanny Hannsen',
        'Poppy Wilson',
    ]
}

export const store = Configurator

    // create a scoped store configurator
    .store<AppState, BaseAction>()

    // reducer on root
    .addReducer((s, a) => s)

    // simple case on root
    .addCase('some-action', (s, a) => {
        return s;
    })

    // async action with action extending
    .addAsyncAction('show-user-list', loadUserList)
    // now the async action type is available for cases and reducers
    .addCase('show-user-list', (s, a) => {
        return s;
    })
    // configurator for nested state
    .nested(
        // selector
        s => s.userList,
        // nested state configuration
        config => config
            // single cases on nested state 'userList'
            .addCase('show-user-list', (s, a) => s.show = true)
            .addCase('show-user-list.loading', (s, a) => s.loading = true)
            .addCase('show-user-list.done', (s, a) => {
                s.loading = false;
                s.list = a.data;
            })
            // simple reducer on nested state
            .addReducer((s, a) => {
                return s;
            }))

    // add a reducer for a nested state
    .addReducer(s => s.userList, (s, a) => s)

    .create(initialState);



export const useAppDispatch = () => useDispatch<ExtractAction<typeof store>>();
export const useAppState = useSelector.wrap<AppState>()
