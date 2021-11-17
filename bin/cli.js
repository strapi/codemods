#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const { version } = require("../package.json");
const {
  defaultCommand,
  migrate,
  migrateApplicationToV4,
  migrateDependenciesToV4,
  migratePluginToV4,
  transform,
} = require("./commands");

// Initial program setup
const program = new Command();

// `$ strapi-codemods version || strapi-codemods -v || strapi-codemods --version`
program.version(
  version,
  "-v, --version",
  "Output your version of @strapi/codemods"
);
program
  .command("version")
  .description("Output your version of @strapi/codemods")
  .action(() => {
    process.stdout.write(version + "\n");
    process.exit(0);
  });

// `$ strapi-codemods || strapi-codemods default`
program
  .command("default", { isDefault: true })
  .description(false)
  .action(async () => {
    await defaultCommand();
    process.exit(0);
  });

// `$ strapi-codemods migrate`
program
  .command("migrate")
  .description("Migrate a v3 Strapi application or plugin to v4")
  .action(async () => {
    await migrate();
  });

// `$ strapi-codemods migrate:application`
program
  .command("migrate:application [path]")
  .description("Migrate a v3 Strapi application to v4")
  .action(async (path) => {
    await migrateApplicationToV4(path);
  });

// `$ strapi-codemods migrate:plugin`
program
  .command("migrate:plugin [path] [pathForV4]")
  .description("Migrate a v3 dependencies to v4")
  .action(async (path, pathForV4) => {
    await migratePluginToV4(path, pathForV4);
  });

// `$ strapi-codemods migrate:dependencies`
program
  .command("migrate:dependencies [path]")
  .description("Migrate a v3 Strapi plugin to v4")
  .action(async (path) => {
    await migrateDependenciesToV4(path);
  });

// `$ strapi-codemods transform`
program
  .command("transform")
  .description("Transform v3 code in your v4 project")
  .action(async () => {
    await transform();
  });

program.parse(process.argv);
