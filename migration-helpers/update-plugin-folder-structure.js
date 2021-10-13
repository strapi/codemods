"use strict";

const fs = require("fs-extra");
const { resolve, join } = require("path");
const j = require("jscodeshift");
const { camelCase } = require("lodash");
const convertModelToContentType = require(`./convert-models-to-content-types`);
const updateRoutes = require(`./update-routes`);
const runJsCodeshift = require('../utils/runJsCodeshift')

const { statement } = j.template;

const SERVER_DIRECTORIES = ["controllers", "models", "middlewares", "services"];

async function migratePlugin(v3PluginPath, v4DestinationPath) {
  const v4Plugin = v4DestinationPath
    ? resolve(v4DestinationPath)
    : resolve(`${v3PluginPath}-v4`);

  const exists = await fs.pathExists(v4Plugin);
  if (exists) {
    console.log(`${v4Plugin} already exists`);
    return;
  }

  try {
    // Create plugin copy
    await fs.copy(resolve(v3PluginPath), v4Plugin);
    console.log(`copied v3 plugin to ${v4Plugin}`);

    // Create root strapi-admin
    const strapiAdmin = join(v4Plugin, `strapi-admin.js`);
    await fs.copy("./utils/strapi-admin.js", strapiAdmin);
    console.log(`created ${strapiAdmin}`);

    // Create root strapi-server
    const strapiServer = join(v4Plugin, `strapi-server.js`);
    await fs.copy("./utils/strapi-server.js", strapiServer);
    console.log(`created ${strapiServer}`);

    // Move all server files to /server
    for (const directory of SERVER_DIRECTORIES) {
      await moveToServer(v4Plugin, ".", directory);

      if (directory === "models") {
        await convertModelToContentType(join(v4Plugin, "server"));
        await createContentTypeIndex(join(v4Plugin, "server", "content-types"));
      } else {
        // Create index file for directory
        await createDirectoryIndex(join(v4Plugin, "server", directory));
      }
    }

    // Move bootstrap to /server/bootstrap.js
    await moveBootstrapFunction(v4Plugin);
    // Move routes
    await updateRoutes(v4Plugin, "index");
    await moveToServer(v4Plugin, ".", "routes");
    // Move policies
    await moveToServer(v4Plugin, "config", "policies");
    await createDirectoryIndex(join(v4Plugin, "server", "policies"));
    // update services
    runJsCodeshift(
      join(v4Plugin, 'server', "services"),
      "use-arrow-function-for-service-export"
    );
    // Create src/server index
    await createServerIndex(join(v4Plugin, "server"));
    console.log(`finished migrating v3 plugin to v4 at ${v4Plugin}`);
  } catch (error) {
    console.error(error.message);
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

async function moveToServer(v4Plugin, originDir, serverDir) {
  const exists = await fs.pathExists(join(v4Plugin, originDir, serverDir));
  if (!exists) return;

  const origin = join(v4Plugin, originDir, serverDir);
  const destination = join(v4Plugin, "server", serverDir);
  await fs.move(origin, destination);

  console.log(`moved ${serverDir} to `, destination);
}

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, "index.js");
  await fs.copy(join(__dirname, "..", "utils", "module-exports.js"), indexPath);

  const dirContent = await fs.readdir(serverDir);
  const filesToImport = dirContent.filter((file) => file !== "index.js");

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function createContentTypeIndex(dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, "index.js");

  await fs.copy(join(__dirname, "..", "utils", "module-exports.js"), indexPath);
  const dirContent = await fs.readdir(dir);
  const filesToImport = dirContent
    .filter((file) => file !== "index.js")
    .map((file) => `${file}/schema`);

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function createDirectoryIndex(dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, "index.js");

  await fs.copy(join(__dirname, "..", "utils", "module-exports.js"), indexPath);

  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const filesToImport = dirContent
    .filter((fd) => fd.isFile() && fd.name !== "index.js")
    .map((file) => file.name);

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
    // Remove extension
    const filename = fileImport.replace(/\.[^/.]+$/, "");

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
    // Remove extension
    const moduleName = mod.replace(/\.[^/.]+$/, "");
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
    throw new Error(
      "error: No arguments provided, please provide: <v3PluginPath> [v4DestinationPath]"
    );
  }

  if (args.length > 2) {
    throw new Error(
      "error: Too many arguments, please provide: <v3PluginPath> [v4DestinationPath]"
    );
  }

  const [v3PluginPath, v4DestinationPath] = args;
  migratePlugin(v3PluginPath, v4DestinationPath);
} catch (error) {
  console.error(error.message);
}
