/* eslint-disable no-unused-vars */
import Store , { Options as StoreOptions } from 'electron-store'
import { MutationPayload } from 'vuex'
import { SetRequired } from 'type-fest'
import { Options as DeepmergeOptions } from 'deepmerge'

export interface Options<T> extends Pick<StoreOptions<T>, 'migrations' | 'encryptionKey'> {
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
	reducer?: Reducer;

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

// Fix deepmerge types. Reference: https://git.io/JGtuC
interface MergeOptions extends SetRequired<DeepmergeOptions, 'isMergeableObject'> {
	cloneUnlessOtherwiseSpecified(value: Record<string, unknown>, options?: MergeOptions): any;
}

export type FinalOptions<T> = SetRequired<Options<T>, 'fileName' | 'storageKey' | 'reducer' | 'arrayMerger' | 'overwrite' | 'checkStorage' | 'storage'>
export type State = Record<string, unknown>
export type Reducer = (state: State, paths: string[] | undefined) => State
export type Filter = (mutation: MutationPayload) => boolean
export type ArrayMerger = (target: any[], source: any[], options: MergeOptions) => any[]