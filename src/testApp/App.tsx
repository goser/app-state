import {FC} from 'react';
import {UserListView} from './UserListView';
import {useAppDispatch, useAppState} from './store';

export const App2: FC = () => {
    const dispatch = useAppDispatch();
    const {data} = useAppState();
    return <div>
        <UserListView />
        <button onClick={() => dispatch({type: 'show-user-list'})}>Userlist</button>
        <hr />
        <div>{data.s}</div>
        <button onClick={() => dispatch({type: 'sub-reducer-action'})}>sub-reducer-action</button>
        <hr />
    </div>;
}