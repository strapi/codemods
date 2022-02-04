![@strapi/codemods](./preview.png)

# @strapi/codemods

> CLI to help you migrate your Strapi applications & plugins from v3 to v4.

## Features

- Migrate a Strapi application to v4
- Migrate a Strapi plugin to v4
- Migrate a Strapi application or a plugin's dependecies to v4

## Getting started

### ⏳ Installation

```bash
yarn add @strapi/codemods
```

**or**

```bash
npm install --save @strapi/codemods
```

### 🖐 Requirements

Before running any commands, be sure you have initialized a git repository, the working tree is clean, you've pushed your code to GitHub, and you are on a new branch.

### 🕹 Usage

#### Migrate

_Usage with prompt_

```bash
yarn @strapi/codemods migrate
```

or

```bash
npx @strapi/codemods migrate
```

The prompt will ask you:

- What do you want to migrate?
  - `Application` (migrate folder structure + dependencies)
  - `Plugin` (migrate folder structure + dependencies)
  - `Dependencies` (on migrate dependencies)
- Where is the project located? (default: `./`).
- _(plugin only)_ Where do you want to create the v4 plugin

_Bypass the prompt_

To bypass the prompts use one of the following commands:

- `Application` migration

```bash
yarn @strapi/codemods migrate:application <path>
```

- `Plugin` migration

```bash
yarn @strapi/codemods migrate:plugin <path> [pathForV4Plugin]
```

> Note: if no `pathForV4Plugin` is provided it will be created at `<path>-v4`

- `Dependencies` migration

```bash
yarn @strapi/codemods migrate:dependencies <path>
```

#### Transform

:warning: _This command will modify your source code. Be sure you have initialized a git repository, the working tree is clean, you've pushed your code to GitHub, and you are on a new branch._

```bash
yarn @strapi/codemods transform
```

or

```bash
npx @strapi/codemods transform
```

The prompt will ask two questions:

- What kind of transformation you want to perform:

  - `find` -> `findMany`: Change `find` method to `findMany`

  - `strapi-some-package` -> `@strapi/some-package`: Update strapi scoped imports

  - `.models` -> `.contentTypes`: Change model getters to content types

  - `strapi.plugins['some-plugin']` -> `strapi.plugin('some-plugin')`: Update top level plugin getters

  - `strapi.plugin('some-plugin').controllers['some-controller']` -> `strapi.plugin('some-plugin').controller('some-controller')`: Use plugin getters

  - Add arrow function for service export

  - Add strapi to bootstrap function params

- Where is the file(s) or folder to transform

Enjoy 🎉
