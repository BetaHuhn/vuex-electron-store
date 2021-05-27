import Store, { Options as StoreOptions } from 'electron-store';
import { MutationPayload } from 'vuex';
import { SetRequired } from 'type-fest';
import { Options as DeepmergeOptions } from 'deepmerge';
export interface Options<T> extends Pick<StoreOptions<T>, 'encryptionKey'> {
    fileName?: StoreOptions<T>['name'];
    storageKey?: string;
    paths?: string[];
    filter?: Filter;
    reducer?: Reducer;
    arrayMerger?: ArrayMerger;
    overwrite?: boolean;
    checkStorage?: boolean;
    storageFileLocation?: StoreOptions<T>['cwd'];
    storage?: Store<T>;
}
interface MergeOptions extends SetRequired<DeepmergeOptions, 'isMergeableObject'> {
    cloneUnlessOtherwiseSpecified(value: Record<string, unknown>, options?: MergeOptions): any;
}
export declare type FinalOptions<T> = SetRequired<Options<T>, 'fileName' | 'storageKey' | 'reducer' | 'arrayMerger' | 'overwrite' | 'checkStorage' | 'storage'>;
export declare type State = Record<string, unknown>;
export declare type Reducer = (state: State, paths: string[] | undefined) => State;
export declare type Filter = (mutation: MutationPayload) => boolean;
export declare type ArrayMerger = (target: any[], source: any[], options: MergeOptions) => any[];
export {};
