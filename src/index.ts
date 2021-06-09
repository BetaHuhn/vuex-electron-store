import merge from 'deepmerge'
import Store from 'electron-store'
import Conf from 'conf'
import { ipcMain, ipcRenderer } from 'electron-better-ipc'
import { BrowserWindow } from 'electron'
import { Store as VuexStore, MutationPayload, Plugin, CommitOptions, DispatchOptions } from 'vuex'

import { reducer, combineMerge, ipcEvents } from './helpers'
import { Options, FinalOptions, Migrations, StoreInterface } from './types'

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
			dev: false,
			ipc: false
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

	clearState() {
		this.opts.storage.clear()
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
			if (this.opts.resetMutation && mutation.type === this.opts.resetMutation) return this.clearState()

			if (this.opts.filter && this.opts.filter(mutation)) return

			this.setState(this.opts.reducer(state, this.opts.paths))
		})
	}

	initIpcConnectionToMain(): void {
		ipcRenderer.send(ipcEvents.CONNECT)

		ipcRenderer.on(ipcEvents.COMMIT, (_event, { type, payload, options }) => {
			this.store.commit(type, payload, options)
		})

		ipcRenderer.on(ipcEvents.DISPATCH, (_event, { type, payload, options }) => {
			this.store.dispatch(type, payload, options)
		})

		ipcRenderer.on(ipcEvents.CLEAR_STATE, () => {
			this.clearState()
		})

		ipcRenderer.answerMain(ipcEvents.GET_STATE, () => {			
			return this.store.state
		})
	}

	/**
	 * Listen for an IPC connection from the renderer and return an interface to it's Vuex Store.
	 * 
	 * Requires `ipc` mode to be enabled in the plugin.
	 * 
	 * Needs to be called in the main process and only supports one connected renderer.
	 * @returns {Object} Methods to interact with the renderer's Vuex Store
	 * @example
	 * ```
	 	// In the main process
		import PersistedState from 'vuex-electron-store'

		const store = PersistedState.getStoreFromRenderer()

		// Commit a mutation
		store.commit(type, payload, options)

		// Dispatch an action
		store.dispatch(type, payload, options)

		// Get the current Vuex State
		const state = await store.getState()

		// Reset the persisted State
		store.clearState()
		```
	*/
	static getStoreFromRenderer(): StoreInterface {
		if (process.type === 'renderer') throw new Error('[Vuex Electron] Only call `.getStoreFromRenderer()` in the main process.')

		// Init electron-store
		PersistedState.initRenderer()

		let connection: Electron.WebContents | undefined

		ipcMain.on(ipcEvents.CONNECT, (event) => {
			if (connection) throw new Error('[Vuex Electron] Already connected to one renderer.')

			connection = event.sender

			// Remove connection when window is closed
			connection.on('destroyed', () => {
				connection = undefined
			})
		})

		const commit: StoreInterface['commit'] = (type: string, payload?: any, options?: CommitOptions) => {
			if (!connection) throw new Error('[Vuex Electron] Not connected to renderer.')

			connection.send(ipcEvents.COMMIT, { type, payload, options })
		}

		const dispatch: StoreInterface['dispatch'] = (type: string, payload?: any, options?: DispatchOptions) => {
			if (!connection) throw new Error('[Vuex Electron] Not connected to renderer.')

			connection.send(ipcEvents.DISPATCH, { type, payload, options })
		}

		const getState: StoreInterface['getState'] = () => {
			if (!connection) throw new Error('[Vuex Electron] Not connected to renderer.')

			const win = BrowserWindow.fromWebContents(connection)
			if (!win) throw new Error('[Vuex Electron] Cannot get BrowserWindow from WebContents.')

			return ipcMain.callRenderer(win, ipcEvents.GET_STATE)
		}

		const clearState: StoreInterface['clearState'] = () => {
			if (!connection) throw new Error('[Vuex Electron] Not connected to renderer.')

			connection.send(ipcEvents.CLEAR_STATE)
		}

		return { commit, dispatch, getState, clearState }
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

			if (persistedState.opts.ipc) {
				persistedState.initIpcConnectionToMain()
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