# @strapi/codemods Readme

This repo offers scripts to help migrate Strapi applications and plugins from v3 to v4

To use the scripts, clone this repo and run all commands from the root.

## Migration helpers

### update-plugin-folder-structure

Organizes v3 Strapi plugin into an acceptable v4 Strapi plugin file structure

`pathToV3Plugin`: _required_

`pathForV4Plugin`: _defaults to:_ `<pathToV3Plugin>-v4`

```bash
node ./migrations-helpers/upate-plugin-folder-structure <pathToV3Plugin> [pathForV4Plugin]
```

### update-api-folder-structure

Organizes a v3 Strapi app into the new v4 Strapi app file structure

`pathToStrapiApp`: _required_

```bash
node ./migration-helpers/update-api-folder-structure <pathToStrapiApp>
```

### update-package-dependencies

Updates all Strapi dependencies found in a v3 Strapi app or plugin

`pathToStrapiApp`: _required_

```bash
node ./migration-helpers/update-package-dependencies <pathToStrapiApp>
```

## Transforms

You can install `jscodeshift` globally or use npx. See jscodeshift docs for all available options: [https://github.com/facebook/jscodeshift](https://github.com/facebook/jscodeshift)

The commands provided below will make changes to your source code

Before running any commands, be sure you have initialized a git repository, the working tree is clean, you've pushed your code to GitHub, and you are on a new branch.

Example jscodehsift command:

```bash
npx jscodeshift -t <path-to-transform> <path-to-file(s)-or-folder>
```

### change-find-to-findMany

`.query().find()` => `.query().findMany()`

```bash
npx jscodeshift -t ./transforms/change-find-to-findMany.js <path-to-file(s)-or-folder>
```

### update-strapi-scoped-imports

`strapi-some-package` => `@strapi/some-package`

```bash
npx jscodeshift -t ./codemods/transforms/update-strapi-scoped-imports.js  <path-to-file(s)-or-folder>
```

### change-model-getters-to-content-types

`.models` => `.contentTypes`

```bash
npx jscodeshift -t ./transforms/change-model-getters-to-content-types.js <path-to-file(s)-or-folder>
```

### update-top-level-plugin-getter

`strapi.plugins['some-plugin']` => `strapi.plugin('some-plugin')`

```bash
npx jscodeshift -t ./transforms/update-top-level-getters.js <path-to-file(s)-or-folder>
```

### use-plugin-getters

`strapi.plugin('some-plugin').controllers['some-controller']` => `strapi.plugin('some-plugin').controller('some-controller')`

```bash
npx jscodeshift -t ./transforms/use-plugin-getters.js <path-to-file(s)-or-folder>
```

### use-arrow-function-for-service-export

```bash
npx jscodeshift -t ./transforms/use-arrow-function-for-service-export.js <path-to-file(s)-or-folder>
```

### add-strapi-to-bootstrap-params

```bash
npx jscodeshift -t ./transforms/add-strapi-to-bootstrap-params.js <path-to-file(s)-or-folder>
```
