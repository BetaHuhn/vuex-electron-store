import { Reducer, ArrayMerger } from './types';
export declare const combineMerge: ArrayMerger;
export declare const reducer: Reducer<any>;
export declare const ipcEvents: {
    CONNECT: string;
    COMMIT: string;
    DISPATCH: string;
    GET_STATE: string;
};
