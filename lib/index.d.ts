import { Store as VuexStore } from 'vuex';
import { Options, FinalOptions } from './types';
declare class PersistedState {
    opts: FinalOptions;
    store: VuexStore<any>;
    constructor(opts: Options, store: VuexStore<any>);
    getState(): any;
    setState(state: any): void;
    checkStorage(): void;
    loadInitialState(): void;
    subscribeOnChanges(): void;
    static create(options?: Options): any;
    static initRenderer(): void;
}
export default PersistedState;
