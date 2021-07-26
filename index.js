"use strict";

const fs = require("fs-extra");
const { resolve, join, relative } = require("path");
const execa = require("execa");

const SERVER_DIRECTORIES = [
  "config",
  "controllers",
  "middlewares",
  "models",
  "services",
  "hooks",
];

async function migratePlugin(pluginPath) {
  // Create mock plugin copy
  await fs.copy(resolve(pluginPath), `./plugin-copy`)

  // https://github.com/strapi/plugin-rfc-examples/tree/master/upload
  const plugin = resolve(`./plugin-copy`);

  // Create root files
  try {
    await fs.copy("./utils/strapi-admin.js", join(plugin, `strapi-admin.js`));
    await fs.copy("./utils/strapi-server.js", join(plugin, `strapi-server.js`));

    // move server files to /src/server
    for (const directory of SERVER_DIRECTORIES) {
      const exists = await fs.pathExists(join(plugin, directory));
      if (!exists) continue;

      await fs.move(
        join(plugin, directory),
        join(plugin, "src", "server", directory)
      );
    }

    await fs.copy(
      "./utils/server-index.js",
      join(plugin, "src", "server", "index.js")
    );

    // move admin files to /src
    await fs.move(join(plugin, "admin", "src"), join(plugin, "src", "admin"));
    await fs.remove(join(plugin, "admin"));
  } catch (error) {
    console.log(error.message);
  }
}

function hasYarn() {
  try {
    const { exitCode } = execa.sync("yarn --version", { shell: true });

    if (exitCode === 0) return true;
    return false;
  } catch (err) {
    return false;
  }
}

function runInstall(path) {
  if (hasYarn()) {
    return execa("yarn", ["install"], {
      cwd: path,
      stdin: "ignore",
    });
  }

  return execa("npm", ["install"], { cwd: path, stdin: "ignore" });
}

migratePlugin("../../plugins/strapi-plugin-stripe-payment");
