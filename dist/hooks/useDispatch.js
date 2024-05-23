import { useStoreContext } from './StoreContext';
var useDispatchIntern = function () { return useStoreContext().store.dispatch; };
Object.assign(useDispatchIntern, {
    scope: function () { return useDispatchIntern; }
});
export var useDispatch = useDispatchIntern;
