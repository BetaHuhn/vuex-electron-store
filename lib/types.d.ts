import Store, { Options as StoreOptions } from 'electron-store';
import { MutationPayload, Store as VuexStore, Plugin } from 'vuex';
import { SetRequired } from 'type-fest';
import { Options as DeepmergeOptions } from 'deepmerge';
export interface Options<T> extends Pick<StoreOptions<T>, 'migrations' | 'encryptionKey'> {
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
export declare class PersistedState<State extends Record<string, any> = Record<string, unknown>> {
    opts: FinalOptions<State>;
    store: VuexStore<any>;
    constructor(options?: Options<State>, store?: VuexStore<State>);
    /**
    * Initializer to set up the required `ipc` communication channels for the module when a `PersistedState` instance is not created in the main process and you are creating a `PersistedState` instance in the Electron renderer process only.
    */
    static initRenderer(): void;
    /**
     * Create a new plugin instance to be included in your Vuex Store
     */
    static create<State>(options?: Options<State>): Plugin<State>;
}
export {};
