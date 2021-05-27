import { Store as VuexStore } from 'vuex';
import { Options, FinalOptions } from './types';
declare class PersistedState<State extends Record<string, any> = Record<string, unknown>> {
    opts: FinalOptions<State>;
    store: VuexStore<any>;
    constructor(opts: Options<State>, store: VuexStore<any>);
    getState(): any;
    setState(state: any): void;
    checkStorage(): void;
    loadInitialState(): void;
    subscribeOnChanges(): void;
    static create<State>(options?: Options<State>): any;
    static initRenderer(): void;
}
export default PersistedState;
