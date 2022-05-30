/**
 * Migrate API folder structure to v4
 */

const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const chalk = require('chalk');

const pluralize = require('pluralize');
const runJscodeshift = require('../utils/run-jscodeshift');
const { logger } = require('../../global/utils');
const updateContentTypes = require('./convert-models-to-content-types');
const updateRoutes = require('./update-routes');
const updatePolicies = require('./update-api-policies');
const renameApiFilesToSingular = require('./rename-api-files-to-singular');

/**
 *
 * @description Recursively removes empty directories
 *
 * @param {array} dirs Directory entries
 * @param {string} baseDir The path to check for empty directories
 */
const cleanEmptyDirectories = async (dirs, baseDir) => {
  for (const dir of dirs) {
    const currentDirPath = join(baseDir, dir.name);

    try {
      const currentDirContent = await fs.readdir(currentDirPath);

      if (!currentDirContent.length) {
        // Remove empty directory
        await fs.remove(currentDirPath);
      } else {
        // Otherwise get the directories of the current directory
        const currentDirs = await getDirsAtPath(currentDirPath);
        await cleanEmptyDirectories(currentDirs, currentDirPath);
      }
    } catch (error) {
      logger.warn(`Failed to remove ${currentDirPath}`);
    }
  }
};

/**
 * @description Get's directory entries from a given path
 *
 * @param {string} path The path to the directory
 * @returns array of of directory entries
 */
const getDirsAtPath = async (path) => {
  const dir = await fs.readdir(path, { withFileTypes: true });
  return dir.filter((fd) => fd.isDirectory());
};

const updateApiFolderStructure = async (appPath) => {
  const strapiAppPath = resolve(appPath);
  const apiDirCopyPath = join(strapiAppPath, 'src', 'api');

  try {
    // Copy the folder to a v3 folder for safe keeping
    await fs.copy(join(strapiAppPath, 'api'), join(strapiAppPath, 'v3', 'api'));
    // Move the original api folder to src/api
    await fs.move(join(strapiAppPath, 'api'), apiDirCopyPath);
  } catch (error) {
    logger.error(`${basename(strapiAppPath)}/api not found, are you sure this is a Strapi app?`);
    process.exit(1);
  }

  const apiDirs = await getDirsAtPath(apiDirCopyPath);

  for (const api of apiDirs) {
    let apiSingularName = pluralize.singular(_.kebabCase(api.name));
    if (apiSingularName !== api.name) {
      await renameApiFilesToSingular(apiDirCopyPath, api.name, apiSingularName);
    }
    const apiPath = join(apiDirCopyPath, apiSingularName);
    await updateContentTypes(apiPath);
    await updateRoutes(apiPath, apiSingularName, api.name);
    await updatePolicies(apiPath);
    // Update services using jscodeshift transform
    await runJscodeshift(
      join(apiDirCopyPath, apiSingularName, 'services'),
      'convert-object-export-to-function'
    );
  }
  logger.info(`migrated ${chalk.yellow(basename(strapiAppPath))} to Strapi v4 🚀`);
  logger.info(`to see changes: Run ${chalk.yellow('git add . && git diff --cached')}`);
  logger.info(
    `to revert: ${chalk.green('git')} reset HEAD --hard && ${chalk.green('git')} clean -xdf`
  );
  logger.info(`to accept: ${chalk.green('git')} commit -am "migrate API to v4 structure"`);

  const dirsWithSingularNames = await getDirsAtPath(apiDirCopyPath);
  await cleanEmptyDirectories(dirsWithSingularNames, apiDirCopyPath);
};

module.exports = updateApiFolderStructure;
