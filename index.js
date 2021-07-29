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
      await moveDirectory(plugin, directory);
    }

    await moveBootstrapFunction(plugin);
    await moveRoutes(plugin)
    await createServerIndex(join(plugin, "src", "server"));
    // move admin files to /src
    await fs.move(join(plugin, "admin", "src"), join(plugin, "src", "admin"));
    await fs.remove(join(plugin, "admin"));
  } catch (error) {
    console.log(error);
  }
}

async function moveRoutes(pluginPath) {
  
  const routes = join(pluginPath, "config", "routes.json")
  await fs.move(
    routes,
    join(pluginPath, "src", "server", "routes.json")
  );
}

async function moveBootstrapFunction(pluginPath) {
  const bootstrapOrigin = join(
    pluginPath,
    "config",
    "functions",
    "bootstrap.js"
  );

  await fs.move(
    bootstrapOrigin,
    join(pluginPath, "src", "server", "bootstrap.js")
  );

  const functionsDir = join(pluginPath, "config", "functions");
  const dirContent = await fs.readdir(functionsDir);

  if (!dirContent.length) {
    await fs.remove(functionsDir);
  }
}

async function moveDirectory(origin, destination) {
  const hasDir = await fs.pathExists(join(origin, destination));
  if (!hasDir) return;

  const serverPath = join(origin, "src", "server");
  await fs.move(join(origin, destination), join(serverPath, destination));

  await createDirectoryIndex(join(serverPath, destination));
}

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, "index.js");
  await fs.copy(join(__dirname, "utils", "module-exports.js"), indexPath);

  const dirContent = await fs.readdir(serverDir);
  console.log(dirContent)
  const filesToImport = dirContent.filter((file) => file !== "index.js");
  
  await addImportsToFile(indexPath, filesToImport);
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
    // TODO: fix this shit
    const filename = fileImport.split(".").slice(0, 1)

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
    // TODO: fix this shit
    const moduleName = mod.split(".").slice(0, 1)
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

migratePlugin("../plugin-tests/strapi-plugin-content-manager");
