'use strict';

const { resolve, join } = require('path');
const fs = require('fs-extra');
const j = require('jscodeshift');
const { camelCase } = require('lodash');

const convertModelToContentType = require(`./convert-models-to-content-types`);
const chalk = require('chalk');

const updateRoutes = require(`./update-routes`);
const runJscodeshift = require('../utils/run-jscodeshift');
const { logger } = require('../../global/utils');

const { statement } = j.template;

const SERVER_DIRECTORIES = ['controllers', 'models', 'middlewares', 'services'];

const migratePlugin = async (v3PluginPath, v4DestinationPath) => {
  const v4Plugin = v4DestinationPath ? resolve(v4DestinationPath) : resolve(`${v3PluginPath}-v4`);

  const exists = await fs.pathExists(v4Plugin);
  if (exists) {
    logger.error(`${chalk.yellow(v4Plugin)} already exists`);
    return;
  }

  try {
    // Create plugin copy
    await fs.copy(resolve(v3PluginPath), v4Plugin);
    logger.info(`copied v3 plugin to ${chalk.yellow(v4Plugin)}`);

    // Create root strapi-admin
    const strapiAdmin = join(v4Plugin, `strapi-admin.js`);
    await fs.copy(join(__dirname, '..', 'utils', 'strapi-admin.js'), strapiAdmin);

    logger.info(`created ${chalk.yellow(strapiAdmin)}`);

    // Create root strapi-server
    const strapiServer = join(v4Plugin, `strapi-server.js`);
    await fs.copy(join(__dirname, '..', 'utils', 'strapi-server.js'), strapiServer);

    logger.info(`created ${chalk.yellow(strapiServer)}`);

    // Move all server files to /server
    for (const directory of SERVER_DIRECTORIES) {
      await moveToServer(v4Plugin, '.', directory);
      // Convert services to function export before creating index file
      if (directory === 'services') {
        await runJscodeshift(
          join(v4Plugin, 'server', 'services'),
          'convert-object-export-to-function'
        );
      }

      // Create index file for directory
      if (directory === 'models') {
        await convertModelToContentType(join(v4Plugin, 'server'));
        await createContentTypeIndex(v4Plugin, join(v4Plugin, 'server', 'content-types'));
      } else {
        await createDirectoryIndex(join(v4Plugin, 'server', directory));
      }
    }

    // Move bootstrap to /server/bootstrap.js
    await moveBootstrapFunction(v4Plugin);
    // Move routes
    await updateRoutes(v4Plugin, 'index');
    await moveToServer(v4Plugin, '.', 'routes');
    // Move policies
    await moveToServer(v4Plugin, 'config', 'policies');
    await createDirectoryIndex(join(v4Plugin, 'server', 'policies'));

    // Create src/server index
    await createServerIndex(join(v4Plugin, 'server'));
    logger.success(`finished migrating v3 plugin to v4 at ${chalk.green(v4Plugin)}`);
  } catch (error) {
    logger.error(error.message);
  }
};

async function moveBootstrapFunction(pluginPath) {
  await moveToServer(pluginPath, join('config', 'functions'), 'bootstrap.js');

  const functionsDir = join(pluginPath, 'config', 'functions');
  const dirContent = await fs.readdir(functionsDir);

  await runJscodeshift(
    join(pluginPath, 'server', 'bootstrap.js'),
    'add-strapi-to-bootstrap-params'
  );

  if (!dirContent.length) {
    await fs.remove(functionsDir);
  }
}

async function moveToServer(v4Plugin, originDir, serverDir) {
  const exists = await fs.exists(join(v4Plugin, originDir, serverDir));
  if (!exists) return;

  const origin = join(v4Plugin, originDir, serverDir);
  const destination = join(v4Plugin, 'server', serverDir);
  await fs.move(origin, destination);

  const destinationLog =
    serverDir === 'models' ? join(v4Plugin, 'server', 'content-types') : destination;
  logger.info(`moved ${chalk.yellow(serverDir)} to ${chalk.yellow(destinationLog)}`);
}

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, 'index.js');
  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);

  const dirContent = await fs.readdir(serverDir);
  const filesToImport = dirContent.filter((file) => file !== 'index.js');

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function createContentTypeIndex(v4PluginPath, dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, 'index.js');

  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);
  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const directoriesToImport = dirContent.filter((fd) => fd.isDirectory()).map((fd) => fd.name);

  for (dir of directoriesToImport) {
    createDirectoryIndex(join(v4PluginPath, 'server', 'content-types', dir));
  }

  await importFilesToIndex(indexPath, directoriesToImport);
  await addModulesToExport(indexPath, directoriesToImport);
}

async function createDirectoryIndex(dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, 'index.js');

  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);

  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const filesToImport = dirContent
    .filter((fd) => fd.isFile() && fd.name !== 'index.js')
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
  const body = root.find(j.Program).get('body');

  imports.forEach((fileImport) => {
    // Remove extension
    const filename = fileImport.replace(/\.[^/.]+$/, '');

    const declaration = statement`const ${camelCase(filename)} = require(${j.literal(
      './' + filename
    )});\n`;

    const hasUseStrict = body.get(0).value.directive === 'use strict';
    if (hasUseStrict) {
      // When use strict is present add imports after
      body.get(0).insertAfter(declaration);
    } else {
      // Otherwise add them to the top of the file
      body.unshift(declaration);
    }
  });

  await fs.writeFile(filePath, root.toSource({ quote: 'single' }));
}

async function addModulesToExport(filePath, modules) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const moduleExports = root.find(j.AssignmentExpression, {
    left: {
      object: {
        name: 'module',
      },
      property: {
        name: 'exports',
      },
    },
  });

  modules.forEach((mod) => {
    // Remove extension
    const moduleName = mod.replace(/\.[^/.]+$/, '');
    const property = j.property(
      'init',
      j.identifier(camelCase(moduleName)),
      j.identifier(camelCase(moduleName))
    );

    moduleExports.get().value.right.properties.push({ ...property, shorthand: true });
  });

  await fs.writeFile(filePath, root.toSource({ quote: 'single' }));
}

module.exports = migratePlugin;
