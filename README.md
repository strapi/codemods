![@strapi/codemods](./preview.png)

# @strapi/codemods

> CLI to help you migrate your Strapi applications & plugins from v3 to v4.

## Features

- Migrate whole project structure
- Switch to the latest strapi v4 dependencies
- Migrate each plugin you want to follow latest v4 plugin guideline

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

*Usage with prompt*

```bash
yarn strapi-codemods migrate
```
OR
```bash
npx strapi-codemods migrate
```

The prompt will ask you 3 things:

1. First, you have to chose what do you want to migrate:
  - `Project` (folder structure + dependencies)
  - `Dependencies` (Only dump dependencies to the latest v4 release)
  - `Plugin` (give you the ability to migrate the folder structure of a specific plugin)
3. Then, where is your Strapi application folder (default: `./`).
4. Finally, if you chose to migrate a plugin it will ask for the plugin's name.


*Bypass the prompt*

If you are annoyed by the prompt and want to use plain command line then we provide you some options:

- `Project` migration

```bash
yarn strapi-codemods migrate --project <path>
```

- `Dependencies` migration

```bash
yarn strapi-codemods migrate --dependencies <path>
```

- `Plugin` migration

```bash
yarn strapi-codemods migrate --plugin <path>
```
> Note that for plugin migration you can only specify the path of the v3 plugin. The v4 plugin will take the name of v3 plugin concat with `-v4`


#### Transform

```bash
yarn strapi-codemods transform
```

OR

```bash
npx strapi-codemods transform
```

1. First, the prompt will ask you what kind of transformation you want to perform:

- `find` -> `findMany`: Change `find` method to `findMany`

- `strapi-some-package` -> `@strapi/some-package`: Update strapi scoped imports

- `.models` -> `.contentTypes`: Change model getters to content types

- `strapi.plugins['some-plugin']` -> `strapi.plugin('some-plugin')`: Update top level plugin getters

- `strapi.plugin('some-plugin').controllers['some-controller']` -> `strapi.plugin('some-plugin').controller('some-controller')`: Use plugin getters

- Add arrow function for service export

- Add strapi to bootstrap function params

2. Then, where is the file(s) or folder to transform

Enjoy 🎉