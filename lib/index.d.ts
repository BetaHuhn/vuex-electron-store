import { Store as VuexStore, Plugin } from 'vuex';
import { Options, FinalOptions, StoreInterface } from './types';
/**
* Persist and rehydrate your [Vuex](https://vuex.vuejs.org/) state in your [Electron](https://electronjs.org) app
*/
declare class PersistedState<State extends Record<string, any> = Record<string, unknown>> {
    opts: FinalOptions<State>;
    store: VuexStore<any>;
    constructor(inputOpts: Options<State>, store: VuexStore<State>);
    getState(): any;
    setState(state: any): void;
    checkStorage(): void;
    loadInitialState(): void;
    subscribeOnChanges(): void;
    initIpcConnectionToMain(): void;
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
    static getStoreFromRenderer(): StoreInterface;
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
    static create<State>(options?: Options<State>): Plugin<State>;
    /**
     * Initializer to set up the required `ipc` communication channels for the [electron-store](https://github.com/sindresorhus/electron-store) module.
     * Needs to be called in the Electron main process.
    */
    static initRenderer(): void;
}
export default PersistedState;
