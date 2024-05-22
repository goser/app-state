import {pause} from '../../pause';
import {GetActionFromAsyncReducer, createAsyncReducer} from '../../store/old/configureStore'

export const showUserListReducer = createAsyncReducer('show-user-list', async () => {
    await pause();
    return [
        'Hans Meiser',
        'Julia Funk',
        'Mark Rober',
        'Fanny Hannsen',
        'Poppy Wilson',
    ]
});

export type ShowUserListAction = GetActionFromAsyncReducer<typeof showUserListReducer>