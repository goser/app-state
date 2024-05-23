import { Dispatch } from 'react';
import { TypedAction } from './TypedAction';
export type AsyncAction<A extends TypedAction> = (dispatch: Dispatch<A>) => void;
export declare const asyncActionLoadingSuffix = ".loading";
export declare const asyncActionDoneSuffix = ".done";
export type AsyncActionLoadingSuffix = typeof asyncActionLoadingSuffix;
export type AsyncActionDoneSuffix = typeof asyncActionDoneSuffix;
