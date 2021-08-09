"use strict";

const fs = require("fs-extra");
const { resolve, join } = require("path");
const j = require("jscodeshift");
const { camelCase } = require("lodash");

const { statement } = j.template;

const SERVER_DIRECTORIES = [
  "controllers",
  "models",
  "middlewares",
  "services",
  "hooks",
];

async function migratePlugin(pluginPath) {
  // Create mock plugin copy
  await fs.copy(resolve(pluginPath), `./plugin-copy`);

  // https://github.com/strapi/plugin-rfc-examples/tree/master/upload
  const plugin = resolve(`./plugin-copy`);

  // Create root files
  try {
    await fs.copy("./utils/strapi-admin.js", join(plugin, `strapi-admin.js`));
    await fs.copy("./utils/strapi-server.js", join(plugin, `strapi-server.js`));

    // move server files to /src/server
    for (const directory of SERVER_DIRECTORIES) {
      await moveToServer(plugin, "/", directory);

      // Quick fix to remove lifecycle file from models
      // This will not work if models are nested in folders
      if (directory === "models") {
        const modelsDir = await fs.readdir("./plugin-copy/src/server/models");
        modelsDir.forEach((model) => {
          if (!model.includes("settings")) {
            fs.removeSync(join("./plugin-copy/src/server/models", model));
          }
        });
      }

      await createDirectoryIndex(join(plugin, "src", "server", directory));
    }

    // move bootstrap to /src/server/bootstrap.js
    await moveBootstrapFunction(plugin);
    // move bootstrap to /src/server/routes.js
    await moveToServer(plugin, "config", "routes.json");
    await createServerIndex(join(plugin, "src", "server"));
    // move admin files to /src
    await fs.move(join(plugin, "admin", "src"), join(plugin, "src", "admin"));
    await fs.remove(join(plugin, "admin"));
  } catch (error) {
    console.log(error);
  }
}

async function moveBootstrapFunction(pluginPath) {
  await moveToServer(pluginPath, join("config", "functions"), "bootstrap.js");

  const functionsDir = join(pluginPath, "config", "functions");
  const dirContent = await fs.readdir(functionsDir);

  if (!dirContent.length) {
    await fs.remove(functionsDir);
  }
}

async function moveToServer(pluginPath, originDir, destination) {
  console.log(`copying ${destination} to`, join(pluginPath, originDir, destination));
  const exists = await fs.pathExists(join(pluginPath, originDir, destination));
  if (!exists) return;

  await fs.move(
    join(pluginPath, originDir, destination),
    join(pluginPath, "src", "server", destination)
  );
}

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, "index.js");
  await fs.copy(join(__dirname, "utils", "module-exports.js"), indexPath);

  const dirContent = await fs.readdir(serverDir);
  const filesToImport = dirContent.filter((file) => file !== "index.js");

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function createDirectoryIndex(dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;
  // get all files from the dir
  const dirContent = await fs.readdir(dir);

  const indexPath = join(dir, "index.js");
  // create index.js for dir
  await fs.copy(join(__dirname, "utils", "module-exports.js"), indexPath);

  // import all files to dir
  const filesToImport = dirContent.filter((file) => file.includes(".js"));

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

/********************
 * TRANSFORMS
 ********************/

/**
 *
 * @param {string} filePath
 * @param {array} imports
 */
async function importFilesToIndex(filePath, imports) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const body = root.find(j.Program).get("body");

  imports.forEach((fileImport) => {
    // TODO: This is not reliable
    // Removes extensions from name
    const filename = fileImport.split(".").slice(0, 1);

    const declaration = statement`const ${camelCase(
      filename
    )} = require(${j.literal("./" + filename)});\n`;

    const hasUseStrict = body.get(0).value.directive === "use strict";
    if (hasUseStrict) {
      // When use strict is present add imports after
      body.get(0).insertAfter(declaration);
    } else {
      // Otherwise add them to the top of the file
      body.unshift(declaration);
    }
  });

  await fs.writeFile(filePath, root.toSource());
}

async function addModulesToExport(filePath, modules) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const moduleExports = root.find(j.AssignmentExpression, {
    left: {
      object: {
        name: "module",
      },
      property: {
        name: "exports",
      },
    },
  });

  modules.forEach((mod) => {
    // TODO: This is not reliable
    // Removes extensions from name
    const moduleName = mod.split(".").slice(0, 1);
    const property = j.property(
      "init",
      j.identifier(camelCase(moduleName)),
      j.identifier(camelCase(moduleName))
    );

    moduleExports
      .get()
      .value.right.properties.push({ ...property, shorthand: true });
  });

  await fs.writeFile(filePath, root.toSource());
}

const args = process.argv.slice(2);

try {
  if (args.length === 0) {
    console.error(
      "No argument provided, please provide the path to the plugin you want to migrate"
    );
  }

  if (args.length > 1) {
    console.error(
      "Too many arguments, please provide the path to the plugin you want to migrate"
    );
  }
} catch (error) {
  console.error(error.message);
}

const [pluginPath] = args;
migratePlugin(pluginPath);
