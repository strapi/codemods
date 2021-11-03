#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const { version } = require("../package.json");
const { defaultCommand, migrate, transform } = require("./commands");

// Initial program setup
const program = new Command();

// `$ strapi-codemods version || strapi-codemods -v || strapi-codemods --version`
program.version(version, "-v, --version", "Output the version number");
program
  .command("version")
  .description("Output your version of Codemods")
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
  .description("Migrate Strapi applications from v3 to v4")
  .action(async () => {
    await migrate();
  });

// `$ strapi-codemods transform`
program
  .command("transform")
  .description("Transform your code to follow v4 requirement")
  .action(async () => {
    await transform();
  });

program.parse(process.argv);
