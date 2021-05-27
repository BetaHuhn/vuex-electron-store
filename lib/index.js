"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const electron_store_1 = __importDefault(require("electron-store"));
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
            checkStorage: true
        };
        if (!inputOpts.storage) {
            defaultOptions.storage = new electron_store_1.default(Object.assign(Object.assign(Object.assign({ name: defaultOptions.fileName }, (inputOpts.encryptionKey && { encryptionKey: inputOpts.encryptionKey })), (inputOpts.storageFileLocation && { cwd: inputOpts.storageFileLocation })), (inputOpts.migrations && { migrations: inputOpts.migrations })));
        }
        this.opts = Object.assign({}, defaultOptions, inputOpts);
        this.store = store;
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
            if (this.opts.filter && this.opts.filter(mutation))
                return;
            this.setState(this.opts.reducer(state, this.opts.paths));
        });
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
            persistedState.loadInitialState();
            persistedState.subscribeOnChanges();
        };
    }
    /**
    * Initializer to set up the required `ipc` communication channels for the module when a `PersistedState` instance is not created in the main process and you are creating a `PersistedState` instance in the Electron renderer process only.
    */
    static initRenderer() {
        electron_store_1.default.initRenderer();
    }
}
exports.default = PersistedState;
