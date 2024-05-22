import {createRoot} from 'react-dom/client';
import {App2} from './App';
import {StoreProvider} from '../hooks/StoreContext';
import {store} from './store';

const rootElement = document.createElement('div');
document.body.append(rootElement);
const root = createRoot(rootElement);

root.render(<StoreProvider store={store}>
    <App2 />
</StoreProvider>);