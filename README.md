<div align="center">
  
# 💾 Vuex Electron Store

[![Node CI](https://github.com/BetaHuhn/vuex-electron-store/workflows/Node%20CI/badge.svg)](https://github.com/BetaHuhn/vuex-electron-store/actions?query=workflow%3A%22Node+CI%22) [![Release CI](https://github.com/BetaHuhn/vuex-electron-store/workflows/Release%20CI/badge.svg)](https://github.com/BetaHuhn/vuex-electron-store/actions?query=workflow%3A%22Release+CI%22) [![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/BetaHuhn/vuex-electron-store/blob/master/LICENSE) ![David](https://img.shields.io/david/betahuhn/vuex-electron-store)

Persist and rehydrate the Vuex state in your Electron app.

</div>

## Features

- 💾 **Persistent state** - *persistently stores the Vuex state in your Electron app*
- 🔌 **Easy integration** - *integrates perfectly with Vue and Electron as a [Vuex Plugin](https://vuex.vuejs.org/guide/plugins.html)*
- 🔨 **Customization** - *specify what [parts of your Vuex state](#only-partially-persist-state) you want to persist and [which mutations are allowed](#filter-mutations)*
- ♻️ **Migration** - *the persisted state can be easily [migrated](#migration-between-versions) between different versions of your Electron app*
- 🔐 **Encryption** - *you can optionally [encrypt](#%EF%B8%8F-options) the storage file with a encryption key*

This library is a wrapper around [electron-store](https://github.com/sindresorhus/electron-store) to make it work directly with Vuex and offer additional features.

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

And then initialize it in the [Electron main process](https://www.electronjs.org/docs/tutorial/quick-start#run-the-main-process):

```js
import PersistedState from 'vuex-electron-store'

PersistedState.initRenderer()
```

> Since Vuex only runs in the renderer, this is needed to setup the required `ipc` communication ([more info](https://github.com/sindresorhus/electron-store#initrenderer))

And you are done! Your Electron app now has a persistent Vuex state! 🎉

## ⚙️ Options

You can also pass an options object to `.create()` to customize the behaviour of [vuex-electron-store](https://github.com/BetaHuhn/vuex-electron-store) further:

```js
PersistedState.create({
	paths: [ 'auth.user' ]
})
```
<details><summary>Here are all the options <a href="https://github.com/BetaHuhn/vuex-electron-store">vuex-electron-store</a> supports:</summary>
<br>

| Name | Type | Description | Default |
| ------------- | ------------- | ------------- | ------------- |
| `fileName` | `string` | Name of the storage file (without extension) | `vuex` |
| `paths` | `array` | An array of any paths to partially persist the state | n/a |
| `filter` | `function` | A function which will be called on each mutation that triggers `setState` | n/a |
| `overwrite` | `boolean` | Overwrite the existing state with the persisted state directly when rehydrating | `false` |
| `storageKey` | `string` | Name of the key used for the stored state object | `state` |
| `checkStorage` | `boolean` | Check if the storage file is available and can be accessed | `true` |
| `dev` | `boolean` | Enable development mode | `false` |
| `reducer` | `function` | A function to reduce the state to persist based on the given paths | n/a |
| `arrayMerger` | `function` | A function for merging arrays when rehydrating state | combine arrays |
| `resetMutation` | `string` | Name of a mutation which when called will reset the persisted state | n/a |
| `encryptionKey` | `string/Buffer/TypedArray/DataView` | Encryption key used to encrypt the storage file | n/a |
| `storageFileLocation` | `string` | Location where the storage file should be stored | [config directory](https://github.com/sindresorhus/env-paths#pathsconfig) |
| `migrations` | `object` | Migration operations to perform to the persisted state whenever a version is upgraded | n/a |
	
</details>

## 🛠️ Configuration

Here are some of the more important options in a more detailed form.

### Paths

You can specify different paths (i.e. parts) of you state with the `paths` option. It accepts an array of paths specified using dot notation e.g. `user.name`.

If no paths are given, the complete state is persisted. If an empty array is given, no state is persisted.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	paths: ['user.token']
})
```

Here, only the `user.token` will be persisted and rehydrated.
	
</details>

---

### Filter

You can limit the mutations which can persist state with the `filter` function. The specified function will be called on each mutation that triggers `setState`.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	filter: (name) => name === 'increment'
})
```

Here, only state changed by the `increment` mutation will be persisted and rehydrated.
	
</details>

---

### Overwrite

By default the the existing state will be merged using [deepmerge](https://github.com/TehShrike/deepmerge) with the persisted state. If you set `overwrite` to true, the persisted state will overwrite the existing state directly when rehydrating.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	overwrite: true
})
```
	
</details>

---

### Development Mode

During development it might be useful to disable persisting and rehydrating the state. You can disable this with the `dev` option. When it is set to true, all changes to the state will not be persisted (regardless of the paths provided), rehydration of the state will be skipped and migrations will not be performed.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	dev: true
})
```
	
</details>

---

### Migrations

You can specify operations to perform to the persisted state whenever a version is upgraded. The `migrations` object should consist of a key-value pair of `'version': handler` (the `version` can also be a [semver range](https://github.com/npm/node-semver#ranges)). In the handler you can manipulate the previously persisted state (just like any other JavaScript object) before it is rehydrated.

<details><summary>See Example</summary><br>
	
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

The `state` parameter contains the persisted state before rehydration.
	
</details>

---

### Reset Mutation

You can programmatically reset the persisted state by specifying the name of a mutation as the `resetMutation` option. Once you call that mutation, the entire persisted state will be deleted. You have to create a mutation by the same name, even if it doesn't do anything.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	resetMutation: 'ELECTRON_STORE_RESET'
})
```
	
You have to create a mutation by the same name, even if it doesn't do anything.:
	
```js
mutations: {
	ELECTRON_STORE_RESET(state) {
		// Optionally do something else here
	}
}	
```

Later in a component or somewhere else:
	
```js
this.$store.commit('ELECTRON_STORE_RESET')
```
	
</details>

---

### Encryption

You can optionally specify an encryption key which will be used to encrypt the storage file using the aes-256-cbc encryption algorithm. This is only secure if you don't store the key in plain text, but in a secure manner in the Node.js app. You could use [node-keytar](https://github.com/atom/node-keytar) to store the encryption key securely, or deriving the key from a password entered by the user.

It might also be useful for obscurity. If a user looks through the config directory and finds the config file, since it's just a JSON file, they may be tempted to modify it. By providing an encryption key, the file will be obfuscated, which should hopefully deter any users from doing so.

<details><summary>See Example</summary><br>
	
```js
PersistedState.create({
	encryptionKey: 'superSecretKey'
})
```

Don't store the key like this if security is of concern, the encryption key would be easily found in the Electron app.
	
</details>

---

## 📖 Examples

Here are a few examples to help you get started!

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

### During development

Setting `dev` to true will stop [vuex-electron-store](https://github.com/BetaHuhn/vuex-electron-store) from persisting and rehydrating the state.

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	plugins: [
		PersistedState.create({
			dev: true
		})
	],
	// ...
})
```

---

### Reset Mutation

You can reset the persisted state by specifying a mutation as the `resetMutation` option and then calling it:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	mutations: {
		ELECTRON_STORE_RESET(state) {
			// Optionally do something else here
		}
	},
	plugins: [
		PersistedState.create({
			resetMutation: 'ELECTRON_STORE_RESET'
		})
	],
	// ...
})

// Later in a component or somewhere else
this.$store.commit('ELECTRON_STORE_RESET')
```

You have to create a mutation by the same name, even if it doesn't do anything.

---

### Encrypting the storage file

You can optionally encrypt/obfuscate the storage file by specifying an encryption key:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	plugins: [
		PersistedState.create({
			encryptionKey: 'superSecretKey'
		})
	],
	// ...
})
```

Don't store the key like this if security is of concern, the encryption key would be easily found in the Electron app.

---

### Migration between versions

You can use migrations to perform operations on the persisted data whenever a version is upgraded. The migrations object should consist of a key-value pair of `'version': handler`. In the handler you can manipulate the state like any other JavaScript object:

```js
import Vue from 'vue'
import Vuex from 'vuex'

import PersistedState from 'vuex-electron-store'

Vue.use(Vuex)

export default new Vuex.Store({
	// ...
	plugins: [
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
	],
	// ...
})
```

The `state` parameter contains the persisted state before rehydration.

## 💻 Development

Issues and PRs are very welcome!

- run `yarn lint` or `npm run lint` to run eslint.
- run `yarn watch` or `npm run watch` to watch for changes.
- run `yarn build` or `npm run build` to produce a compiled version in the `lib` folder.

### Todo

- Add support for Vue 3

## ❔ About

This project was developed by me ([@betahuhn](https://github.com/BetaHuhn)) in my free time. If you want to support me:

[![Donate via PayPal](https://img.shields.io/badge/paypal-donate-009cde.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=394RTSBEEEFEE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F81S2RK)

### Credit

This library is a wrapper around the great [electron-store](https://github.com/sindresorhus/electron-store) by [@sindresorhus](https://github.com/sindresorhus) and was inspired by [vuex-electron](https://github.com/vue-electron/vuex-electron) and [vuex-persistedstate](https://github.com/robinvdvleuten/vuex-persistedstate).

## 📄 License

Copyright 2021 Maximilian Schiller

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
