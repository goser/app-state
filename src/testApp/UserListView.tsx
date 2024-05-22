import {FC} from 'react';
import {useAppState} from './store';

export const UserListView: FC = () => {
    const {list, show, loading} = useAppState(s => s.userList);
    if (!show) {
        return null;
    }
    return <div>
        {list.length > 0
            ? list.map((entry, index) => <div key={`${entry}${index}`}>{entry}</div>)
            : <div>Die Liste ist leer.</div>}
        {loading && <div>Lädt...</div>}
    </div>
}