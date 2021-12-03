#!/usr/bin/env node
'use strict';

const { resolve } = require('path');
const { Command } = require('commander');

const { version } = require('../package.json');

const { defaultMigrate, defaultTransform, defaultCommand } = require('./commands/default-commands');
const migrate = require('./commands/migrate');

// Initial program setup
const program = new Command();

// `$ strapi-codemods version || strapi-codemods -v || strapi-codemods --version`
program.version(version, '-v, --version', 'Output your version of @strapi/codemods');
program
  .command('version')
  .description('Output your version of @strapi/codemods')
  .action(() => {
    process.stdout.write(version + '\n');
    process.exit(0);
  });

// `$ strapi-codemods || strapi-codemods default`
program
  .command('default', { isDefault: true })
  .description(false)
  .action(async () => {
    await defaultCommand();
    process.exit(0);
  });

// `$ strapi-codemods migrate`
program
  .command('migrate')
  .description('Migrate a v3 Strapi application or plugin to v4')
  .action(async () => {
    await defaultMigrate();
  });

// `$ strapi-codemods migrate:application`
program
  .command('migrate:application [path]')
  .description('Migrate a v3 Strapi application to v4')
  .action(async (path) => {
    await migrate('application', path);
  });

// `$ strapi-codemods migrate:plugin`
program
  .command('migrate:plugin [path] [pathForV4]')
  .description('Migrate a v3 dependencies to v4')
  .action(async (path, pathForV4) => {
    const pathForV4Plugin = pathForV4 ? resolve(pathForV4) : resolve(`${path}-v4`);

    await migrate('plugin', path, pathForV4Plugin);
  });

// `$ strapi-codemods migrate:dependencies`
program
  .command('migrate:dependencies [path]')
  .description('Migrate a v3 Strapi plugin to v4')
  .action(async (path) => {
    await migrate('dependencies', path);
  });

// `$ strapi-codemods transform`
program
  .command('transform')
  .description('Transform v3 code in your v4 project')
  .action(async () => {
    await defaultTransform();
  });

program.parse(process.argv);
