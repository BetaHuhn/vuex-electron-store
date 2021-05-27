import Store, { Options as StoreOptions } from 'electron-store';
import { MutationPayload } from 'vuex';
import { SetRequired } from 'type-fest';
import { Options as DeepmergeOptions } from 'deepmerge';
export interface Options<T> extends Pick<StoreOptions<T>, 'encryptionKey'> {
    /**
     * Name of the storage file (without extension).
     *
     * This is useful if you want multiple storage files for your app.
     * Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.
     * @default 'vuex'
    */
    fileName?: StoreOptions<T>['name'];
    /**
     * Name of the key used for the stored state object
     * @default 'state'
    */
    storageKey?: string;
    /**
     * An array of any paths to partially persist the state.
     *
     * If no paths are given, the complete state is persisted, if an empty array is given, no state is persisted.
     *
     * Paths must be specified using dot notation e.g. `user.name`
    */
    paths?: string[];
    /**
     * A function which will be called on each mutation that triggers `setState`.
     * Can be used to filter which mutations can persist their state
    */
    filter?: Filter;
    /**
     * A function to reduce the state to persist based on the given paths.
     * The returned state will be persisted
     *
     * Defaults to include all of the specified paths
    */
    reducer?: Reducer<T>;
    /**
     * A function for merging arrays when rehydrating state.
     * Will be passed as the [arrayMerge](https://github.com/TehShrike/deepmerge#arraymerge) argument to [deepmerge](https://github.com/TehShrike/deepmerge)
     *
     * Defaults to combine the existing state with the persisted state
    */
    arrayMerger?: ArrayMerger;
    /**
     * Overwrite the existing state with the persisted state directly when rehydrating.
     *
     * By default the two states will be merged with [deepmerge](https://github.com/TehShrike/deepmerge)
     * @default false
    */
    overwrite?: boolean;
    /**
     * Check if the [electron-store](https://github.com/sindresorhus/electron-store) is available.
     * Will run during the plugin's initialization and perform a Write-Read-Delete operation
     * @default true
    */
    checkStorage?: boolean;
    /**
     * Enable development mode.
     *
     * During development it might be useful to disable persisting and rehydrating the state.
     *
     * All changes to the state will not be persisted, regardless of the paths provided and rehydration of the state will be skipped.
     * Migrations will also not be performed.
     * @default false
    */
    dev?: boolean;
    /**
     * Name of a mutation which when called will reset the persisted state.
     *
     * The entire persisted state will be deleted
     * Requires a mutation with the same name.
     * @example
        ```
        mutations: {
            ELECTRON_STORE_RESET(state) {}
        },
        plugins: [
            PersistedState.create({
                resetMutation: 'ELECTRON_STORE_RESET'
            })
        ],
        ```
    */
    resetMutation?: string;
    /**
     * Migration operations to perform to the persisted state whenever a version is upgraded.
     *
     * The `migrations` object should consist of a key-value pair of `'version': handler`.
     * The `version` can also be a [semver range](https://github.com/npm/node-semver#ranges).
     * @example
        ```
        PersistedState.create({
            migrations: {
                '0.1.0': (state) => {
                    state.debugPhase = true
                },
                '1.0.0': (state) => {
                    delete state.debugPhase
                    state.phase = '1.0.0'
                },
                '1.0.2': (state) => {
                    state.phase = '1.0.2'
                },
                '>=2.0.0': (state) => {
                    state.phase = '>=2.0.0'
                }
            }
        })
        ```
    */
    migrations?: Record<string, (state: T) => void>;
    /**
     * Location where the storage file should be stored.
     * If a relative path is provided, it will be relative to the default cwd.
     *
     * __Don't specify this unless absolutely necessary ([more info](https://github.com/sindresorhus/electron-store#cwd))__
     * The only use-case I can think of is having the config located in the app directory or on some external storage.
     *
     * Default: System default user [config directory](https://github.com/sindresorhus/env-paths#pathsconfig).
    */
    storageFileLocation?: StoreOptions<T>['cwd'];
    /**
     * An existing [electron-store](https://github.com/sindresorhus/electron-store) instance which should be used.
     *
     * By default a new one will be created automatically
    */
    storage?: Store<T>;
}
interface MergeOptions extends SetRequired<DeepmergeOptions, 'isMergeableObject'> {
    cloneUnlessOtherwiseSpecified(value: Record<string, unknown>, options?: MergeOptions): any;
}
export declare type FinalOptions<T> = SetRequired<Options<T>, 'fileName' | 'storageKey' | 'reducer' | 'arrayMerger' | 'overwrite' | 'checkStorage' | 'dev' | 'storage'>;
export declare type Reducer<State> = (state: State, paths: string[] | undefined) => any;
export declare type Filter = (mutation: MutationPayload) => boolean;
export declare type ArrayMerger = (target: any[], source: any[], options: MergeOptions) => any[];
export declare type Migrations<State> = StoreOptions<State>['migrations'];
export {};
