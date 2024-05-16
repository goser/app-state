import {createRoot} from 'react-dom/client';
import {App} from './App';
import {StoreProvider} from '../hooks/StoreContext';
import {store} from './store';

const root = createRoot(document.querySelector('#root')!);

root.render(<StoreProvider store={store}>
    <App />
</StoreProvider>);