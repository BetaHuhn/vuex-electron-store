import merge from 'deepmerge'
import Store from 'electron-store'
import Conf from 'conf'
import { Store as VuexStore, MutationPayload, Plugin } from 'vuex'

import { reducer, combineMerge } from './helpers'
import { Options, FinalOptions, Migrations } from './types'

/**
* Persist and rehydrate your [Vuex](https://vuex.vuejs.org/) state in your [Electron](https://electronjs.org) app
*/
class PersistedState<State extends Record<string, any> = Record<string, unknown>> {

	opts: FinalOptions<State>
	store: VuexStore<any>

	constructor(inputOpts: Options<State>, store: VuexStore<State>) {
		const defaultOptions: any = {
			fileName: 'vuex',
			storageKey: 'state',
			reducer: reducer,
			arrayMerger: combineMerge,
			overwrite: false,
			checkStorage: true,
			dev: false
		}

		this.opts = Object.assign({}, defaultOptions, inputOpts)
		this.store = store

		// Generate electron-store migrations from migrate state functions
		const migrations: Migrations<State> = {}
		if (inputOpts.migrations && !this.opts.dev) {
			Object.entries(inputOpts.migrations).forEach(([version, migrate]) => {

				migrations[version] = (store: Conf<State>) => {
					const state = store.get(this.opts.storageKey)

					migrate(state)

					store.set(this.opts.storageKey, state)
				}
			})
		}

		// Create new electron-store instance
		if (!inputOpts.storage) {
			this.opts.storage = new Store({
				name: this.opts.fileName,
				encryptionKey: this.opts.encryptionKey,
				cwd: this.opts.storageFileLocation,
				migrations
			})
		}
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

			if (!persistedState.opts.dev) {
				persistedState.loadInitialState()
				persistedState.subscribeOnChanges()
			}
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