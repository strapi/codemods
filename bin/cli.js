#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const { version } = require("../package.json");
const { defaultCommand, migrate, transform } = require("./commands");

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
  .option("--project <path>", "directly trigger project migration")
  .option("--dependencies <path>", "migrate your dependencies to v4")
  .option("--plugin <path>", "migrate one of your plugin")
  .description("Migrate a v3 Strapi application or plugin to v4")
  .action(async (options) => {
    await migrate(options);
  });

// `$ strapi-codemods transform`
program
  .command("transform")
  .description("Transform your v3 code to v4")
  .action(async () => {
    await transform();
  });

program.parse(process.argv);
