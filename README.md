# Codemod Readme

# WIP

This repo uses jscodeshift and node scripts to migrate a Strapi v3 application or plugin to v4

## Migration helpers

### update-api-folder-structure

Navigate to the strapi project you want to migrate

```bash
node <path/to/strapi-codemods/migration-helpers/update-api-folder-structure>
```

## Transforms

You can install `jscodeshift` globally or use npx. See jscodeshift docs for all available options: [https://github.com/facebook/jscodeshift](https://github.com/facebook/jscodeshift)

To use this repository for migrating a strapi application, I recommend cloning the repo into the application you want to migrate.

The commands provided below will make changes to your source code

I recommend initialize a git repository if you don't already have one and add `strapi-codemods` to the .gitignore

Make sure your git tree is clean before running any commands, and the git diff after to see what changed.

_There is a dry run option from jscodeshift but it doesn't show you what was changed_

Example jscodehsift command:

```bash
npx jscodeshift -t <path-to-transform> <path-to-file(s)>
```

_You can pass multiple files or a directory_

### change-find-to-findMany

Replaces `.query().find()` with `.query().findMany()`

```bash
npx jscodeshift -t ./strapi-codemods/transforms/change-find-to-findMany.js <path-to-file>
```

example (update bootstrap seed script):

```bash
npx jscodeshift -t ./strapi-codemods/transforms/change-find-to-findMany.js  ./config/functions/bootstrap.js
```

### update-strapi-scoped-imports

Replace `strapi-some-package` with `@strapi/some-package`

```bash
npx jscodeshift -t ./strapi-codemods/transforms/update-strapi-scoped-imports.js  <path-to-file>>
```

example (update all imports found in ./api):

```bash
npx jscodeshift -t ./strapi-codemods/transforms/update-strapi-scoped-imports.js  ./api
```
