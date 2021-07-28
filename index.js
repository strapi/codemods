"use strict";

const fs = require("fs-extra");
const { resolve, join } = require("path");
const j = require("jscodeshift");
const { camelCase } = require("lodash");

const { statement } = j.template;

const SERVER_DIRECTORIES = [
  "controllers",
  "middlewares",
  "models",
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
      const exists = await fs.pathExists(join(plugin, directory));
      if (!exists) continue;

      await fs.move(
        join(plugin, directory),
        join(plugin, "src", "server", directory)
      );

      await createDirectoryIndex(join(plugin, "src", "server", directory));
    }

    // handle config
    const pluginConfig = join(plugin, "config");
    await fs.move(
      join(pluginConfig, "functions", "bootstrap.js"),
      join(plugin, "src", "server", "bootstrap.js")
    );
    await fs.remove(join(pluginConfig, "functions"))
    const configDirectory = await fs.readdir(join(plugin, "config"));
    console.log(configDirectory)

    await fs.copy(
      "./utils/module-exports.js",
      join(plugin, "src", "server", "index.js")
    );

    // move admin files to /src
    await fs.move(join(plugin, "admin", "src"), join(plugin, "src", "admin"));
    await fs.remove(join(plugin, "admin"));
  } catch (error) {
    console.log(error);
  }
}

// getModels
// getControllers
// getBootstrap
// getServices
// getHooks

async function createDirectoryIndex(dir) {
  // get all files from the dir
  const filesToImport = await fs.readdir(dir);

  const indexPath = join(dir, "index.js");
  // create index.js for dir
  await fs.copy(join(__dirname, "utils", "module-exports.js"), indexPath);
  // import all files to dir
  await addImportsToFile(indexPath, filesToImport);
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
async function addImportsToFile(filePath, imports) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const body = root.find(j.Program).get("body");

  imports.forEach((fileImport) => {
    const filename = fileImport.replace(".js", "");

    const declaration = statement`const ${camelCase(
      filename
    )} = require(${j.literal("./" + filename)});\n`;

    const hasUseStrict = body.get(0).value.directive === "use strict";
    if (hasUseStrict) {
      // When use strict is present import after
      body.get(0).insertAfter(declaration);
    } else {
      //  Otherwise add them to the top of the file
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

  modules.forEach((module) => {
    const moduleName = module.replace(".js", "");
    // Get all varaiable declarations that are importing mo
    moduleExports
      .get()
      .value.right.properties.push(
        j.property(
          "init",
          j.identifier(camelCase(moduleName)),
          j.identifier(camelCase(moduleName))
        )
      );
  });

  await fs.writeFile(filePath, root.toSource());
}

migratePlugin("../../plugins/strapi-plugin-stripe-payment");
