/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
	...require('@betahuhn/config').eslintTypescript,
	rules: {
		'@typescript-eslint/explicit-module-boundary-types': 0,
		'@typescript-eslint/no-explicit-any': 0
	}
}