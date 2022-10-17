'use strict';

const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');
const axios = require('axios');
const chalk = require('chalk');
const { strapiPackages, toBeDeleted, toBeRemoved } = require('../utils/strapi-packages');
const { logger } = require('../../global/utils');

async function getLatestStrapiVersion() {
  try {
    const { data } = await axios.get(
      `https://registry.npmjs.org/${encodeURIComponent('@strapi/strapi')}`
    );

    return data['dist-tags'].latest;
  } catch (error) {
    logger.error('Failed to fetch the latest version of Strapi');
  }
}

const updatePackageDependencies = async (appPath) => {
  // Import the app's package.json as an object
  const packageJSONPath = path.resolve(appPath, 'package.json');
  let packageJSON;
  try {
    packageJSON = require(packageJSONPath);
  } catch (error) {
    logger.error('Could not find a package.json. Are you sure this is a Strapi app?');
    process.exit(1);
  }

  if (_.isEmpty(packageJSON.dependencies)) {
    logger.error(`${chalk.yellow(appPath)} does not have dependencies`);
    process.exit(1);
  }

  // Get the latest Strapi release version
  const latestStrapiVersion = await getLatestStrapiVersion();

  // Write all the package JSON changes in a new object
  const v4PackageJSON = _.cloneDeep(packageJSON);
  Object.keys(packageJSON.dependencies).forEach((depName) => {
    const newStrapiDependency = strapiPackages[depName];
    if (newStrapiDependency) {
      // The dependency is a v3 Strapi package, remove it
      delete v4PackageJSON.dependencies[depName];
      if (newStrapiDependency === toBeDeleted) {
        // Warn user if the dependency doesn't exist anymore
        logger.warn(`${depName} does not exist anymore in Strapi v4`);
      } else if (newStrapiDependency === toBeRemoved) {
        // Warn user if the dependency no longer needs to be declared in package.json
        logger.info(`${depName} does not need to be defined in package.json`);
      } else {
        // Replace dependency if there's a matching v4 package
        v4PackageJSON.dependencies[newStrapiDependency] = latestStrapiVersion;
      }
    } else if (depName === 'sqlite3') {
      // The dependency is sqlite, switch to new package
      delete v4PackageJSON.dependencies[depName];
      v4PackageJSON.dependencies['better-sqlite3'] = '^7.6.2';
    }
  });

  // Update node and npm compatibility
  v4PackageJSON.engines.node = '>=14.19.1 <=16.x.x';
  v4PackageJSON.engines.npm = '>=6.0.0';

  try {
    await fse.writeJSON(packageJSONPath, v4PackageJSON, { spaces: 2 });
  } catch (error) {
    logger.error(`Failed to update ${chalk.yellow(packageJSONPath)}`);
  }
};

module.exports = updatePackageDependencies;
