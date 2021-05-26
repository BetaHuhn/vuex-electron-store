import Store from 'electron-store';
import { MutationPayload } from 'vuex';
export interface Options {
    fileName?: string;
    storageKey?: string;
    paths?: string[];
    filter?: (mutation: MutationPayload) => boolean;
    reducer?: (state: any, paths: string[]) => Record<string, unknown>;
    arrayMerger?: (target: any[], source: any[], options: any) => any;
    overwrite?: boolean;
    checkStorage?: boolean;
    storage?: Store;
}
export interface FinalOptions {
    fileName: string;
    storageKey: string;
    paths: string[];
    filter?: (mutation: MutationPayload) => boolean;
    reducer: (state: any, paths: string[]) => Record<string, unknown>;
    arrayMerger: (target: any[], source: any[], options: any) => any;
    overwrite: boolean;
    checkStorage: boolean;
    storage: Store;
}
