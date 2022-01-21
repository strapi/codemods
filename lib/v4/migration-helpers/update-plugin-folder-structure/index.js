'use strict';

const { resolve, join } = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const { logger } = require('../../../global/utils');
const convertModelToContentType = require('../convert-models-to-content-types');
const updateRoutes = require('../update-routes');
const runJscodeshift = require('../../utils/run-jscodeshift');
const {
  createDirectoryIndex,
  createServerIndex,
  createContentTypeIndex,
  moveToServer,
  moveBootstrapFunction
} = require('./utils');

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
        await runJscodeshift(join(v4Plugin, 'server', 'services'), 'convert-object-export-to-function');
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

module.exports = migratePlugin;
