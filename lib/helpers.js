"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.combineMerge = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const dot_prop_1 = __importDefault(require("dot-prop"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const combineMerge = (target, source, options) => {
    const destination = target.slice();
    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
        }
        else if (options.isMergeableObject(item)) {
            destination[index] = deepmerge_1.default(target[index], item, options);
        }
        else if (target.indexOf(item) === -1) {
            destination.push(item);
        }
    });
    return destination;
};
exports.combineMerge = combineMerge;
// TODO: Get Reducer<State> to work
const reducer = (state, paths) => {
    if (Array.isArray(paths)) {
        return paths.reduce((substate, path) => {
            return dot_prop_1.default.set(substate, path, dot_prop_1.default.get(state, path));
        }, {});
    }
    return state;
};
exports.reducer = reducer;
