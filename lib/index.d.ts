import { Store as VuexStore, Plugin } from 'vuex';
import { Options, FinalOptions } from './types';
/**
* Persist and rehydrate your [Vuex](https://vuex.vuejs.org/) state in your [Electron](https://electronjs.org) app
*/
declare class PersistedState<State extends Record<string, any> = Record<string, unknown>> {
    opts: FinalOptions<any>;
    store: VuexStore<any>;
    constructor(inputOpts: Options<State>, store: VuexStore<State>);
    getState(): any;
    setState(state: any): void;
    checkStorage(): void;
    loadInitialState(): void;
    subscribeOnChanges(): void;
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
    * Initializer to set up the required `ipc` communication channels for the module when a `PersistedState` instance is not created in the main process and you are creating a `PersistedState` instance in the Electron renderer process only.
    */
    static initRenderer(): void;
}
export default PersistedState;
