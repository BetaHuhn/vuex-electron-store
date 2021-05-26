/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import dotProp from 'dot-prop'
import merge from 'deepmerge'

export const combineMerge = (target: any[], source: any[], options: any): any[] => {
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

export const reducer = (state: any, paths: string[]): any => {
	if (Array.isArray(paths)) {
		return paths.reduce((substate, path) => {
			return dotProp.set(substate, path, dotProp.get(state, path))
		}, {})
	}

	return state
}