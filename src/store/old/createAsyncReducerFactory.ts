import {Reducer} from '../../reducer/Reducer';
import {AsyncActionDoneSuffix, AsyncActionLoadingSuffix, asyncActionDoneSuffix, asyncActionLoadingSuffix} from '../AsyncAction';
import {TypedAction} from '../TypedAction';
import {asyncActions} from './configureStore';

export type AddAsyncActions<A extends TypedAction, Type extends string, Data> = A
    | {type: `${Type}${AsyncActionLoadingSuffix}`}
    | {type: `${Type}${AsyncActionDoneSuffix}`, data: Data};

export const createAsyncReducerFactory = <Action extends TypedAction>() => {
    return {
        create: <Type extends Action['type'], Loader extends (action: Extract<Action, {type: Type;}>) => Promise<any>>(typeString: Type, loader: Loader) => {
            return <S, A extends TypedAction>(reducer: Reducer<S, AddAsyncActions<A, Type, Awaited<ReturnType<Loader>>>>) => {
                return (state: S, action: A) => {
                    switch (action.type) {
                        case typeString:
                            asyncActions.push((dispatch) => {
                                dispatch({type: `${typeString}${asyncActionLoadingSuffix}`} as any);
                                loader(action as any).then(data => {
                                    dispatch({type: `${typeString}${asyncActionDoneSuffix}`, data} as any);
                                });
                            });
                            break;
                    }
                    return reducer(state, action);
                };
            };
        }
    };
};

