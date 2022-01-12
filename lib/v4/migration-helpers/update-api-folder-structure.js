/**
 * Migrate API folder structure to v4
 */

const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const chalk = require('chalk');

const runJscodeshift = require('../utils/run-jscodeshift');
const { logger } = require('../../global/utils');
const updateContentTypes = require('./convert-models-to-content-types');
const updateRoutes = require('./update-routes');

const normalizeName = _.kebabCase;

/**
 *
 * @param {string} apiPath Path to the current api
 */
const updatePolicies = async (apiPath) => {
  const v3PoliciesPath = join(apiPath, 'config', 'policies');

  const exists = await fs.exists(v3PoliciesPath);
  if (!exists) return;

  const v3Policies = await fs.readdir(v3PoliciesPath, { withFileTypes: true });
  const policyFiles = v3Policies.filter((fd) => fd.isFile());

  if (!policyFiles.length) {
    await fs.remove(v3PoliciesPath);
  }

  const v4PoliciesPath = join(apiPath, 'policies');
  try {
    for (const policy of policyFiles) {
      await fs.copy(join(v3PoliciesPath, policy.name), join(v4PoliciesPath, policy.name));
    }
    // delete the v3 policy folder
    await fs.remove(v3PoliciesPath);
  } catch (error) {
    logger.error(
      `an error occured when migrating a policy from ${chalk.yellow(
        v3PoliciesPath
      )} to ${chalk.yellow(v4PoliciesPath)}`
    );
  }
};

/**
 *
 * @description Recursively removes empty directories
 *
 * @param {array} dirs Directory entries
 * @param {string} baseDir The path to check for empty directories
 */
const cleanEmptyDirectories = async (dirs, baseDir) => {
  for (const dir of dirs) {
    try {
      const currentDirPath = join(baseDir, dir.name);
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
      logger.error('failed to remove empty directories');
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

const renameApiFolder = async (apiDirCopyPath, strapiAppPath) => {
  try {
    // Remove the old api folder
    await fs.remove(join(strapiAppPath, 'api'));
    // Rename the api-copy folder api
    await fs.rename(apiDirCopyPath, join(strapiAppPath, 'src', 'api'));
  } catch (error) {
    logger.error(`failed to rename the api folder, check: ${chalk.yellow(apiDirCopyPath)}`);
  }
};

const updateApiFolderStructure = async (appPath) => {
  const strapiAppPath = resolve(appPath);
  const apiDirCopyPath = join(strapiAppPath, 'src', 'api-copy');

  try {
    await fs.copy(join(strapiAppPath, 'api'), apiDirCopyPath);
  } catch (error) {
    logger.error(`${basename(strapiAppPath)}/api not found, are you sure this is a Strapi app?`);
    process.exit(1);
  }

  const apiDirs = await getDirsAtPath(apiDirCopyPath);

  for (const api of apiDirs) {
    const apiName = normalizeName(api.name);
    const apiPath = join(apiDirCopyPath, apiName);
    await updateContentTypes(apiPath);
    await updateRoutes(apiPath, apiName);
    await updatePolicies(apiPath);
    // Update services using jscodeshift transform
    await runJscodeshift(join(apiDirCopyPath, apiName, 'services'), 'convert-object-export-to-function');
  }
  logger.info(`migrated ${chalk.yellow(basename(strapiAppPath) + '/api')} to Strapi v4 🚀`);
  logger.info(`to see changes: Run ${chalk.yellow('git add . && git diff --cached')}`);
  logger.info(
    `to revert: ${chalk.green('git reset HEAD --hard && git clean -xdf')}`
  );
  logger.info(`to accept: ${chalk.green('git commit -am "migrate API to v4 structure"')}`);

  await cleanEmptyDirectories(apiDirs, apiDirCopyPath);
  await renameApiFolder(apiDirCopyPath, strapiAppPath);
};

module.exports = updateApiFolderStructure;
