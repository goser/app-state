import {FC} from 'react';
import {UserListView} from './UserListView';
import {useAppDispatch} from './store';

export const App: FC = () => {
    const dispatch = useAppDispatch();
    return <div>
        <UserListView />
        <button onClick={() => dispatch({type: 'show-user-list'})}>Userlist</button>
    </div>;
}