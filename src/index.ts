import merge from 'deepmerge'
import Store from 'electron-store'
import { Store as VuexStore, MutationPayload, Plugin } from 'vuex'

import { reducer, combineMerge } from './helpers'
import { Options, FinalOptions } from './types'

/**
* Persist and rehydrate your [Vuex](https://vuex.vuejs.org/) state in your [Electron](https://electronjs.org) app
*/
class PersistedState<State extends Record<string, any> = Record<string, unknown>> {

	opts: FinalOptions<any>
	store: VuexStore<any>

	constructor(inputOpts: Options<State>, store: VuexStore<State>) {
		const defaultOptions: any = {
			fileName: 'vuex',
			storageKey: 'state',
			reducer: reducer,
			arrayMerger: combineMerge,
			overwrite: false,
			checkStorage: true
		}

		if (!inputOpts.storage) {
			defaultOptions.storage = new Store({
				name: defaultOptions.fileName,
				...(inputOpts.encryptionKey && { encryptionKey: inputOpts.encryptionKey }),
				...(inputOpts.storageFileLocation && { cwd: inputOpts.storageFileLocation }),
				...(inputOpts.migrations && { migrations: inputOpts.migrations })
			})
		}

		this.opts = Object.assign({}, defaultOptions, inputOpts)
		this.store = store
	}

	getState(): any {
		return this.opts.storage.get(this.opts.storageKey)
	}

	setState(state: any): void {
		this.opts.storage.set(this.opts.storageKey, state)
	}

	checkStorage(): void {
		try {
			const testKey = '@@'

			this.opts.storage.set(testKey, 1)
			this.opts.storage.get(testKey)
			this.opts.storage.delete(testKey)
		} catch (error) {
			throw new Error('[Vuex Electron] Storage is not valid. Please, read the docs.')
		}
	}

	loadInitialState(): void {
		const persistedState = this.getState()
		if (!persistedState) return

		if (this.opts.overwrite) return this.store.replaceState(persistedState)

		const mergedState = merge(this.store.state, persistedState, {
			arrayMerge: this.opts.arrayMerger
		})

		this.store.replaceState(mergedState)
	}

	subscribeOnChanges(): void {
		this.store.subscribe((mutation: MutationPayload, state: any) => {
			if (this.opts.filter && this.opts.filter(mutation)) return

			this.setState(this.opts.reducer(state, this.opts.paths))
		})
	}

	/**
	 * Create a new Vuex plugin which initializes the [electron-store](https://github.com/sindresorhus/electron-store), rehydrates the state and persistently stores any changes
	 * @param {Options} Options - Configuration options
	 * @returns The Vuex Plugin
	 * @example
		```
		import Vue from 'vue'
		import Vuex from 'vuex'

		import PersistedState from 'vuex-electron-store'

		Vue.use(Vuex)

		export default new Vuex.Store({
			// ...
			plugins: [
				PersistedState.create()
			],
			// ...
		})
		```
	*/
	static create <State>(options: Options<State> = {}): Plugin<State> {
		return (store: VuexStore<State>) => {
			const persistedState = new PersistedState(options, store)

			if (persistedState.opts.checkStorage) {
				persistedState.checkStorage()
			}

			persistedState.loadInitialState()
			persistedState.subscribeOnChanges()
		}
	}

	/**
	 * Initializer to set up the required `ipc` communication channels for the [electron-store](https://github.com/sindresorhus/electron-store) module.
	 * Needs to be called in the Electron main process.
	*/
	static initRenderer(): void {
		Store.initRenderer()
	}
}

export default PersistedState