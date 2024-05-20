import {Store} from './Store';

export type ExtractAction<S extends Store> = S extends Store<any, infer Action> ? Action : never;
