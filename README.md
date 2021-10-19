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

```bash
yarn codemods migrate
```
OR
```bash
npx codemods migrate
```

The prompt will ask you 3 things:

1. First, you have to chose what do you want to migrate:
  - `Project` (folder structure + dependencies)
  - `Dependencies` (Only dump dependencies to the latest v4 release)
  - `Plugin` (give you the ability to migrate the folder structure of a specific plugin)
3. Then, where is your Strapi application folder (default: `./`).
4. Finally, if you chose to migrate a plugin it will ask for the plugin's name.

Enjoy 🎉