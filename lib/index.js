"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const electron_store_1 = __importDefault(require("electron-store"));
const electron_better_ipc_1 = require("electron-better-ipc");
const electron_1 = require("electron");
const helpers_1 = require("./helpers");
/**
* Persist and rehydrate your [Vuex](https://vuex.vuejs.org/) state in your [Electron](https://electronjs.org) app
*/
class PersistedState {
    constructor(inputOpts, store) {
        const defaultOptions = {
            fileName: 'vuex',
            storageKey: 'state',
            reducer: helpers_1.reducer,
            arrayMerger: helpers_1.combineMerge,
            overwrite: false,
            checkStorage: true,
            dev: false,
            ipc: false
        };
        this.opts = Object.assign({}, defaultOptions, inputOpts);
        this.store = store;
        // Generate electron-store migrations from migrate state functions
        const migrations = {};
        if (inputOpts.migrations && !this.opts.dev) {
            Object.entries(inputOpts.migrations).forEach(([version, migrate]) => {
                migrations[version] = (store) => {
                    const state = store.get(this.opts.storageKey);
                    migrate(state);
                    store.set(this.opts.storageKey, state);
                };
            });
        }
        // Create new electron-store instance
        if (!inputOpts.storage) {
            this.opts.storage = new electron_store_1.default({
                name: this.opts.fileName,
                encryptionKey: this.opts.encryptionKey,
                cwd: this.opts.storageFileLocation,
                migrations
            });
        }
    }
    getState() {
        return this.opts.storage.get(this.opts.storageKey);
    }
    setState(state) {
        this.opts.storage.set(this.opts.storageKey, state);
    }
    checkStorage() {
        try {
            const testKey = '@@';
            this.opts.storage.set(testKey, 1);
            this.opts.storage.get(testKey);
            this.opts.storage.delete(testKey);
        }
        catch (error) {
            throw new Error('[Vuex Electron] Storage is not valid. Please, read the docs.');
        }
    }
    loadInitialState() {
        const persistedState = this.getState();
        if (!persistedState)
            return;
        if (this.opts.overwrite)
            return this.store.replaceState(persistedState);
        const mergedState = deepmerge_1.default(this.store.state, persistedState, {
            arrayMerge: this.opts.arrayMerger
        });
        this.store.replaceState(mergedState);
    }
    subscribeOnChanges() {
        this.store.subscribe((mutation, state) => {
            if (this.opts.resetMutation && mutation.type === this.opts.resetMutation)
                return this.setState({});
            if (this.opts.filter && this.opts.filter(mutation))
                return;
            this.setState(this.opts.reducer(state, this.opts.paths));
        });
    }
    initIpcConnectionToMain() {
        electron_better_ipc_1.ipcRenderer.send(helpers_1.ipcEvents.CONNECT);
        electron_better_ipc_1.ipcRenderer.on(helpers_1.ipcEvents.COMMIT, (_event, { type, payload, options }) => {
            this.store.commit(type, payload, options);
        });
        electron_better_ipc_1.ipcRenderer.on(helpers_1.ipcEvents.DISPATCH, (_event, { type, payload, options }) => {
            this.store.dispatch(type, payload, options);
        });
        electron_better_ipc_1.ipcRenderer.answerMain(helpers_1.ipcEvents.GET_STATE, () => {
            return this.store.state;
        });
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
        ```
    */
    static getStoreFromRenderer() {
        if (process.type === 'renderer')
            throw new Error('[Vuex Electron] Only call `.getStoreFromRenderer()` in the main process.');
        // Init electron-store
        PersistedState.initRenderer();
        let connection;
        electron_better_ipc_1.ipcMain.on(helpers_1.ipcEvents.CONNECT, (event) => {
            if (connection)
                throw new Error('[Vuex Electron] Already connected to one renderer.');
            connection = event.sender;
            // Remove connection when window is closed
            connection.on('destroyed', () => {
                connection = undefined;
            });
        });
        const commit = (type, payload, options) => {
            if (!connection)
                throw new Error('[Vuex Electron] Not connected to renderer.');
            connection.send(helpers_1.ipcEvents.COMMIT, { type, payload, options });
        };
        const dispatch = (type, payload, options) => {
            if (!connection)
                throw new Error('[Vuex Electron] Not connected to renderer.');
            connection.send(helpers_1.ipcEvents.DISPATCH, { type, payload, options });
        };
        const getState = () => {
            if (!connection)
                throw new Error('[Vuex Electron] Not connected to renderer.');
            const win = electron_1.BrowserWindow.fromWebContents(connection);
            if (!win)
                throw new Error('[Vuex Electron] Cannot get BrowserWindow from WebContents.');
            return electron_better_ipc_1.ipcMain.callRenderer(win, helpers_1.ipcEvents.GET_STATE);
        };
        return { commit, dispatch, getState };
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
    static create(options = {}) {
        return (store) => {
            const persistedState = new PersistedState(options, store);
            if (persistedState.opts.checkStorage) {
                persistedState.checkStorage();
            }
            if (!persistedState.opts.dev) {
                persistedState.loadInitialState();
                persistedState.subscribeOnChanges();
            }
            if (persistedState.opts.ipc) {
                persistedState.initIpcConnectionToMain();
            }
        };
    }
    /**
     * Initializer to set up the required `ipc` communication channels for the [electron-store](https://github.com/sindresorhus/electron-store) module.
     * Needs to be called in the Electron main process.
    */
    static initRenderer() {
        electron_store_1.default.initRenderer();
    }
}
exports.default = PersistedState;
