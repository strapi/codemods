# Codemod Readme

This repo offers scripts to help migrate Strapi applications and plugins from v3 to v4

To use the scripts, clone this repo and run all commands from the root.

## Migration helpers

### update-plugin-folder-structure

Organizes v3 Strapi plugin into an acceptable v4 Strapi plugin file structure

`pathToV3Plugin`: *required*
`pathForV4Plugin`: *defaults to:* `<pathToV3Plugin>-v4`

```bash
node ./migrations-helpers/upate-plugin-folder-structure <pathToV3Plugin> [pathForV4Plugin]
```

### update-api-folder-structure

Organizes a v3 Strapi app into the new v4 Strapi app file structure

`pathToStrapiApp`:  *required*

```bash
node ./migration-helpers/update-api-folder-structure <pathToStrapiApp>
```

### update-package-dependencies

Updates all Strapi dependencies found in a v3 Strapi app or plugin

`pathToStrapiApp`:  *required*

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

_You can pass multiple files or a directory_

### change-find-to-findMany

Replaces `.query().find()` with `.query().findMany()`

```bash
npx jscodeshift -t ./codemods/transforms/change-find-to-findMany.js <path-to-file>
```

example (update bootstrap seed script):

```bash
npx jscodeshift -t ./codemods/transforms/change-find-to-findMany.js  ./config/functions/bootstrap.js
```

### update-strapi-scoped-imports

Replace `strapi-some-package` with `@strapi/some-package`

```bash
npx jscodeshift -t ./codemods/transforms/update-strapi-scoped-imports.js  <path-to-file>
```

example (update all imports found in ./api):

```bash
npx jscodeshift -t ./codemods/transforms/update-strapi-scoped-imports.js  ./api
```
