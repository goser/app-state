import {combineReducers} from '../combineReducers';
import {ReducerNode} from '../reducer/Reducer';
import {AsyncAction, AsyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionDoneSuffix, asyncActionLoadingSuffix} from '../store/AsyncAction';
import {Loader} from '../store/Loader';
import {Store, StoreSubscriber} from '../store/Store';
import {TypedAction} from '../store/TypedAction';

type AddReducer<State, Action extends TypedAction> = {

    <S extends State, R = unknown>(
        selector: (state: S) => R,
        reducer: ReducerNode<R, Action>
    ): Configurator<State, Action>

    (reducer: ReducerNode<State, Action>): Configurator<State, Action>

}

type BaseConfigurator<State, Action extends TypedAction> = {

    addReducer: AddReducer<State, Action>

    addCase: <Type extends Action['type']>(
        type: Type,
        handler: (state: State, action: Extract<Action, {type: Type}>) => void
    ) => Configurator<State, Action>
}

type ParentBaseConfigurator<State extends Object, Action extends TypedAction> = BaseConfigurator<State, Action> & {
    nested: <R = unknown>(
        selector: (state: State) => R,
        handler: (config: DecidedConfigurator<R, Action>) => Configurator<R, Action>
    ) => BaseConfigurator<State, Action>
}

type DecidedConfigurator<State, Action extends TypedAction> = State extends Function
    ? BaseConfigurator<State, Action>
    : (State extends object
        ? ParentBaseConfigurator<State, Action>
        : BaseConfigurator<State, Action>)

type Configurator<State, Action extends TypedAction> = DecidedConfigurator<State, Action> & {

    addAsyncAction: <Type extends string, L extends Loader>(
        type: Exclude<Type, Action['type']>,
        promiseCreator: L
    ) => Configurator<State, Action
        | {type: Type, params: Parameters<L>[0]}
        | {type: `${Type}${AsyncActionDoneSuffix}`, data: Awaited<ReturnType<L>>}
        | {type: `${Type}${AsyncActionLoadingSuffix}`}>

    create: (initialState: State) => Store<State, Action>

};

const createNestedConfigurator = <S, A extends TypedAction>(): BaseConfigurator<S, A> => {

    const config: BaseConfigurator<S, A> = {
        addReducer
    }
    return config;
}

const createConfigurator = <S, A extends TypedAction>(): Configurator<S, A> => {

    const reducers: ReducerNode<S, A>[] = [];
    let postActions: AsyncAction<any>[] = [];

    const addSimpleReducer = (reducer: ReducerNode<S, A>) => {
        reducers.push(reducer);
    }

    const addNestedReducer = <R = unknown>(selector: (state: S) => R, reducer: ReducerNode<R, A>) => {
        reducer = combineReducers(reducer);
        const wrapper = createWrapper(selector, reducer);
        /*
            What should createWrapper do?
            - evaluate path for the selector
            - create the reducer
            What should the wrapper do?
            - use selector to get current nested value
            - deep copy state
                - when reaching the path
                    - send current nested value  through given reducer an use the result in the deep copy
        */
        reducers.push(wrapper);
    }

    const configurator: Configurator<S, A> = {

        addAsyncAction: (type, loader) => {
            reducers.push((state, action) => {
                if (action.type === type) {
                    postActions.push((dispatch) => {
                        dispatch({type: `${type}${asyncActionLoadingSuffix}`} as any);
                        loader(action as any).then(data => {
                            dispatch({type: `${type}${asyncActionDoneSuffix}`, data} as any);
                        });
                    });
                }
                return state;
            });
            return configurator as any;
        },

        addCase: (type: any, handler: any) => {
            // TODO
            return configurator;
        },

        addReducer: (...args: any) => {
            if (args.length === 2) {
                addNestedReducer.apply(null, args);
            } else {
                addSimpleReducer.apply(null, args);
            }
            return configurator;
        },

        nested: (selector, handler) => {
            const nestedConfigurator = createNestedConfigurator();
            handler(nestedConfigurator);
            reducers.push((state, action) => {
                const nestedState = selector(state);

                return state;
            });
            return configurator;
        },

        create: (initialState: S): Store<S, A> => {
            let state = initialState;
            let isDispatching = false;
            let subscribers: StoreSubscriber<S>[] = [];
            const unsubscribe = (subscriber: StoreSubscriber<S>) => {
                subscribers = subscribers.filter(sub => sub !== subscriber);
            };
            const reducer = combineReducers(reducers);
            const dispatch = (action: A) => {
                if (isDispatching) {
                    throw Error('Dispatch inside reducer is not allowed!');
                }
                const previousState = state;
                try {
                    isDispatching = true;
                    state = reducer(state, action);
                } finally {
                    isDispatching = false;
                }
                subscribers.forEach(subscriber => subscriber(previousState, state));
                const actions = postActions;
                postActions = [];
                actions.forEach(action => action(dispatch));
            }
            return {
                getState: () => state,
                dispatch,
                subscribe: (subscriber) => {
                    unsubscribe(subscriber);
                    subscribers.push(subscriber);
                },
                unsubscribe,
            }
        },

    }
    return configurator;
}

type ConfiguratorGlobal = {
    store: <S, A extends TypedAction>() => Configurator<S, A>
}

export const Configurator: ConfiguratorGlobal = {
    store: <S, A extends TypedAction>() => createConfigurator<S, A>()
};