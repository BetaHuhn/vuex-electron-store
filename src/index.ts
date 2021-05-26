import merge from 'deepmerge'
import Store from 'electron-store'
import { Store as VuexStore, MutationPayload } from 'vuex'

import { reducer, combineMerge } from './helpers'
import { Options, FinalOptions } from './types'

class PersistedState {

	opts: FinalOptions
	store: VuexStore<any>

	constructor(opts: Options, store: VuexStore<any>) {
		const defaultOptions: any = {
			fileName: 'vuex',
			storageKey: 'state',
			paths: [],
			filter: undefined,
			reducer: reducer,
			arrayMerger: combineMerge,
			overwrite: false,
			checkStorage: true
		}

		if (!opts.storage) {
			defaultOptions.storage = new Store({
				name: defaultOptions.fileName
			})
		}

		this.opts = Object.assign({}, defaultOptions, opts)
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

	static create(options: Options = {}): any {
		return (store: VuexStore<any>) => {
			const persistedState = new PersistedState(options, store)

			if (persistedState.opts.checkStorage) {
				persistedState.checkStorage()
			}

			persistedState.loadInitialState()
			persistedState.subscribeOnChanges()
		}
	}

	static initRenderer(): void {
		Store.initRenderer()
	}
}

export default PersistedState