<div align="center">
  
# 💾 Vuex Electron Store

[![Node CI](https://github.com/BetaHuhn/vuex-electron-store/workflows/Node%20CI/badge.svg)](https://github.com/BetaHuhn/vuex-electron-store/actions?query=workflow%3A%22Node+CI%22) [![Release CI](https://github.com/BetaHuhn/vuex-electron-store/workflows/Release%20CI/badge.svg)](https://github.com/BetaHuhn/vuex-electron-store/actions?query=workflow%3A%22Release+CI%22) [![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/BetaHuhn/vuex-electron-store/blob/master/LICENSE) ![David](https://img.shields.io/david/betahuhn/vuex-electron-store)

Persist and rehydrate your Vuex state in your Electron app.

</div>

## 👋 Introduction

[Vuex Electron Store](https://github.com/BetaHuhn/vuex-electron-store) integrates perfectly with Vuex and Electron and persistently stores your state between app restarts. You can customize which [specific state](#only-partially-persist-state) you want to persist and even [filter the mutations](#filter-mutations) which are allowed to persist their state. The data is saved in a JSON file stored the users [appData directory](https://www.electronjs.org/docs/api/app#appgetpathname) and can be [migrated between versions](#migration-between-versions).

This library is basically a wrapper around [electron-store](https://github.com/sindresorhus/electron-store) to make it work directly with Vuex and supports most of it's features like [encryption](#%EF%B8%8F-options) and [migrations](#migration-between-versions).

## 🚀 Get started

```shell
npm install vuex-electron-store
```

*Requires Electron 11 or later and currently only works with Vue 2*

## 📚 Usage

To use [vuex-electron-store](https://github.com/BetaHuhn/vuex-electron-store), add it as a plugin to your Vuex store:

```js
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

And then initialize it in the Electron main process:

```js
import PersistedState from 'vuex-electron-store'

PersistedState.initRenderer()
```

> This is needed to setup the required `ipc` communication for the [electron-store](https://github.com/sindresorhus/electron-store) module ([more info](https://github.com/sindresorhus/electron-store#initrenderer))

You can also pass an options object to `.create()` to customize the behaviour of [vuex-electron-store](https://github.com/BetaHuhn/vuex-electron-store) further:

```js
PersistedState.create({
	paths: [ 'auth.user' ]
})
```

See all available options [below](#%EF%B8%8F-options).

## ⚙️ Options

Here are all the options [vuex-electron-store](https://github.com/BetaHuhn/vuex-electron-store) supports:

| Name | Type | Description | Default |
| ------------- | ------------- | ------------- | ------------- |
| `fileName` | `string` | Name of the storage file (without extension) | `vuex` |
| `paths` | `array` | An array of any paths to partially persist the state. If no paths are given, the complete state is persisted. If an empty array is given, no state is persisted. Paths must be specified using dot notation e.g. `user.name` | n/a |
| `filter` | `function` | Will be called on each mutation that triggers `setState` and can be used to filter which mutations can persist their state | n/a |
| `overwrite` | `boolean` | When rehydrating, whether to overwrite the existing state with the persisted state directly, instead of merging the two objects with [`deepmerge`](https://github.com/TehShrike/deepmerge) | `false` |
| `storageKey` | `string` | Name of the key used for the stored state object | `state` |
| `checkStorage` | `boolean` | Check during the plugin's initialization if storage is available. A Write-Read-Delete operation will be performed | `true` |
| `reducer` | `function` | Will be called with the state and the paths as parameters to reduce the state to persist based on the given paths. Output will be persisted | Defaults to include the specified paths |
| `arrayMerger` | `function` | A function for merging arrays when rehydrating state. Will be passed as the [arrayMerge](https://github.com/TehShrike/deepmerge#arraymerge) argument to `deepmerge` | Defaults to combine the existing state with the persisted state |
| `encryptionKey` | `string/Buffer/TypedArray/DataView` | Will be used to encrypt the storage file. Only secure if you don't store the key in plain text ([more info](https://github.com/sindresorhus/electron-store#encryptionkey)) | n/a |
| `storageFileLocation` | `string` | Location where the storage file should be stored. If a relative path is provided, it will be relative to the default cwd. Don't specify this unless absolutely necessary ([more info](https://github.com/sindresorhus/electron-store#cwd)) | Defaults to optimal location based on system conventions |
| `migrations` | `object` | Migration operations to perform to the persisted data whenever a version is upgraded. The migrations object should consist of a key-value pair of `'version': handler` | n/a |

See below for some [examples](#-examples).

## 📖 Examples

Here are a few examples to help you get started!

---

### Basic Example

In this example the entire state will be persisted and rehydrated after a restart:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	state: {
		username: ''
	},
	plugins: [
		PersistedState.create()
	],
	// ...
})
```

---

### Only partially persist state

In this example only part of the state will be persisted and rehydrated after a restart:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	state: {
		input: ''
		user: {
			token: ''
		}
	},
	plugins: [
		PersistedState.create({
			paths: ['user.token']
		})
	],
	// ...
})
```

Here, only the `user.token` will be persisted and rehydrated.

---

### Filter mutations

In this example we add a filter to specify which mutations can persist the updated state:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	mutations: {
		// ...
		increment(state) {
			// mutate state
			state.count++
		},
		decrement(state) {
			// mutate state
			state.count--
		}
	},
	plugins: [
		PersistedState.create({
			filter: (name) => name === 'increment'
		})
	],
	// ...
})
```

Here, only state changed by the `increment` mutation will be persisted and rehydrated.

---

### Merging arrays

By default arrays from the existing state will be merged with arrays from the persisted state. You can change this behaviour by specifying a different [`arrayMerger`](https://github.com/TehShrike/deepmerge#arraymerge) function which [deepmerge](https://github.com/TehShrike/deepmerge) will use to merge the two arrays.

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	state: {
		todos: ['test1', 'test2']
	},
	plugins: [
		PersistedState.create({
			arrayMerger: (stateArray, persistedStateArray, options) => { /* ... */ }
		})
	],
	// ...
})
```

Use the function below to overwrite the existing arrays with the persisted arrays:

```js
const overwriteMerge = (stateArray, persistedStateArray, options) => persistedStateArray
```

If you want to overwrite the entire state, not just arrays, set the [`overwrite`](#%EF%B8%8F-options) option to `true` instead.

---

### Overwriting the existing state

By default the existing state will be merged with the persisted state using [deepmerge](https://github.com/TehShrike/deepmerge). You can disable this behaviour and instead directly overwrite the existing state with the persisted state using the `overwrite` option:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	plugins: [
		PersistedState.create({
			overwrite: true
		})
	],
	// ...
})
```

---

### Migration between versions

You can use migrations to perform operations on the persisted data whenever a version is upgraded. The migrations object should consist of a key-value pair of `'version': handler`. In the handler you can manipulate the state like any other JavaScript object:

```js
PersistedState.create({
	migrations: {
		'0.1.0': (state) => {
			state.debugPhase = true
		},
		'1.0.0': (state) => {
			delete state.debugPhase
			state.phase = '1.0.0'
		},
		'1.0.2': (state) => {
			state.phase = '1.0.2'
		},
		'>=2.0.0': (state) => {
			state.phase = '>=2.0.0'
		}
	}
})
```

> The `state` parameter contains the persisted state before rehydration.

---

## 📝 Todo

- [ ] Resetting the persisted state programmatically
- [ ] Create modified version for Vue 3

Feel free to create a PR if you need one of the mentioned features!

## 💻 Development

Issues and PRs are very welcome!

- run `yarn lint` or `npm run lint` to run eslint.
- run `yarn watch` or `npm run watch` to watch for changes.
- run `yarn build` or `npm run build` to produce a compiled version in the `lib` folder.

## ❔ About

This project was developed by me ([@betahuhn](https://github.com/BetaHuhn)) in my free time. If you want to support me:

[![Donate via PayPal](https://img.shields.io/badge/paypal-donate-009cde.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=394RTSBEEEFEE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F81S2RK)

### Credit

This library is a wrapper around the great [electron-store](https://github.com/sindresorhus/electron-store) by [@sindresorhus](https://github.com/sindresorhus) and was inspired by [vuex-electron](https://github.com/vue-electron/vuex-electron) and [vuex-persistedstate](https://github.com/robinvdvleuten/vuex-persistedstate).

## 📄 License

Copyright 2021 Maximilian Schiller

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
