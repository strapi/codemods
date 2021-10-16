#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const { version } = require("../package.json");
const { migrate, transform } = require("./commands");

// Initial program setup
const program = new Command();

// `$ codemods version || codemods -v || codemods --version`
program.version(version, "-v, --version", "Output the version number");
program
  .command("version")
  .description("Output your version of Codemods")
  .action(() => {
    process.stdout.write(version + "\n");
    process.exit(0);
  });

// `$ codemods generate`
program
  .command("migrate")
  .description("migrate Strapi applications from v3 to v4")
  .action(async () => {
    await migrate();
  });

// `$ codemods transform`
program
  .command("transform")
  .description("transform your code to follow v4 requirement")
  .action(async () => {
    await transform();
  });

program.parse(process.argv);
