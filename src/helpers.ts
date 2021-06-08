import dotProp from 'dot-prop'
import merge from 'deepmerge'

import { Reducer, ArrayMerger } from './types'

export const combineMerge: ArrayMerger = (target, source, options) => {
	const destination = target.slice()

	source.forEach((item, index) => {
		if (typeof destination[index] === 'undefined') {
			destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
		} else if (options.isMergeableObject(item)) {
			destination[index] = merge(target[index], item, options)
		} else if (target.indexOf(item) === -1) {
			destination.push(item)
		}
	})

	return destination
}

// TODO: Get Reducer<State> to work
export const reducer: Reducer<any> = (state, paths) => {
	if (Array.isArray(paths)) {
		return paths.reduce((substate, path) => {
			return dotProp.set(substate, path, dotProp.get(state, path))
		}, {})
	}

	return state
}

export const ipcEvents = {
	CONNECT: 'vuex-electron-store-connect',
	COMMIT: 'vuex-electron-store-commit',
	DISPATCH: 'vuex-electron-store-dispatch',
	GET_STATE: 'vuex-electron-store-get-state'
}