import {useDispatch} from '../hooks/useDispatch';
import {useSelector} from '../hooks/useSelector';
import {pause} from '../pause';
import {Reducer} from '../reducer/Reducer';
import {TypedAction} from '../store/TypedAction';
import {configureStore} from '../store/configureStore';
import {AddAsyncActions} from '../store/createAsyncReducerFactory';

type BaseAction = {type: 'some-action'}

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


type AA = 'A' | 'B' | 'C'
type DD = Exclude<'D', AA>




type ConfiguratorInstane<State, Action extends TypedAction> = {
    store: () => ConfiguratorInstane<State, Action>
    addReducer: (reducer: Reducer<State, Action>) => ConfiguratorInstane<State, Action>
    addCase: <Type extends Action['type']>(
        type: Type,
        handler: (state: State, action: Action) => void
    ) => ConfiguratorInstane<State, Action>
    addAsyncAction: <Type extends string>(
        type: Exclude<Type, Action['type']>,
        promiseCreator: (...args: any) => Promise<any>
    ) => ConfiguratorInstane<State, Action>
};

type ConfiguratorGlobal = {
    store: <State, Action extends TypedAction>() => ConfiguratorInstane<State, Action>
}

const Configurator: ConfiguratorGlobal = null as any;

export const store = Configurator
    .store<AppState, BaseAction>()
    .addReducer((s, a) => s)
    .addCase('some-action', (s, a) => {
        return s;
    })
    // async action with action extending
    // extra actions are available in following configuration calls
    .addAsyncAction('show-user-list', loadUserList)
    .addCase('show-user-list', (s, a) => {
        return s;
    })
    // single case on root
    // configurator for sub state
    .sub(
        // selector
        s => s.userList,
        // sub configuration
        subConfigurator => subConfigurator
            // single cases on sub state 'userList'
            .addCase('show-user-list', (s, a) => s.show = true)
            .addCase('show-user-list.loading', (s, a) => s.loading = true)
            .addCase('show-user-list.done', (s, a) => {
                s.loading = false;
                s.list = a.data;
            })
            .addReducer((s, a) => {
                return s;
            }))
    // classic reducer
    .addReducer((s, a) => {
        return s;
    })
    // classic reducer for sub state (by selector)
    // short form for sub() and subConfigurator.addReducer()
    .addReducer(s => s.userList, (s, a) => {
        return s;
    })
    .create(initialState);



export const useAppDispatch = () => useDispatch<ExtractAction<typeof store>>();
export const useAppState = useSelector.wrap<AppState>()