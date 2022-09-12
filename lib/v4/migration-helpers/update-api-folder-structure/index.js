/**
 * Migrate API folder structure to v4
 */

const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const chalk = require('chalk');
const { Liquid } = require('liquidjs');

const pluralize = require('pluralize');
const runJscodeshift = require('../../utils/run-jscodeshift');
const { logger } = require('../../../global/utils');
const updateContentTypes = require('../convert-models-to-content-types');
const updateRoutes = require('../update-application-routes');
const updateControllers = require('../update-application-controllers');
const updateServices = require('../update-application-services');
const updatePolicies = require('../update-api-policies');
const renameApiFilesToSingular = require('../rename-api-files-to-singular');
const { getDirsAtPath, cleanEmptyDirectories } = require('./utils');

const liquidEngine = new Liquid({
  root: resolve(__dirname, 'templates'),
  extname: '.liquid'
})

const updateApiFolderStructure = async (appPath) => {
  const strapiAppPath = resolve(appPath);
  const apiDirCopyPath = join(strapiAppPath, 'src', 'api');

  try {
    // Copy the api folder to the v3 folder for safe keeping
    await fs.copy(join(strapiAppPath, 'api'), join(strapiAppPath, 'v3', 'api'));
    // Move the original api folder to src/api
    await fs.move(join(strapiAppPath, 'api'), apiDirCopyPath);
  } catch (error) {
    logger.error(`${basename(strapiAppPath)}/api or ${basename(strapiAppPath)}/config not found, are you sure this is a Strapi app?`);
    process.exit(1);
  }

  const extensionPath = join(strapiAppPath, 'src', 'extensions');
  const extensionDirs = await getDirsAtPath(extensionPath);
  for (const extension of extensionDirs) {
    await updateContentTypes(join(extensionPath, extension.name));
  }

  const apiDirs = await getDirsAtPath(apiDirCopyPath);
  for (const api of apiDirs) {
    let apiSingularName = pluralize.singular(_.kebabCase(api.name));
    if (apiSingularName !== api.name) {
      await renameApiFilesToSingular(apiDirCopyPath, api.name, apiSingularName);
    }
    const apiPath = join(apiDirCopyPath, apiSingularName);
    await updateContentTypes(apiPath);
    await updateRoutes(apiPath, apiSingularName, liquidEngine);
    await updateControllers(apiPath, apiSingularName, liquidEngine);
    await updateServices(apiPath, apiSingularName, liquidEngine);
    await updatePolicies(apiPath);
    // Update services using jscodeshift transform
    await runJscodeshift(
      join(apiDirCopyPath, apiSingularName, 'services'),
      'convert-object-export-to-function'
    );
  }
  logger.info(`migrated ${chalk.yellow(basename(strapiAppPath))} to Strapi v4 🚀`);
  logger.warn('Custom config, controllers, services, and routes were not migrated')
  logger.warn('These will need to be updated manually');
  logger.info(`to see changes: Run ${chalk.yellow('git add . && git diff --cached')}`);
  logger.info(
    `to revert: ${chalk.green('git')} reset HEAD --hard && ${chalk.green('git')} clean -xdf`
  );
  logger.info(`to accept: ${chalk.green('git')} commit -am "migrate API to v4 structure"`);

  const dirsWithSingularNames = await getDirsAtPath(apiDirCopyPath);
  await cleanEmptyDirectories(dirsWithSingularNames, apiDirCopyPath);
};

module.exports = updateApiFolderStructure;
