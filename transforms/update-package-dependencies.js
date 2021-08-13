"use strict";

const fse = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const axios = require('axios');

// Match old Strapi packages to their new names on npm
const toBeDeleted = Symbol()
const strapiPackages = {
  "strapi": "@strapi/strapi",
  "strapi-admin": "@strapi/admin",
  "strapi-connector-bookshelf": toBeDeleted,
  "strapi-plugin-content-manager": "@strapi/plugin-content-manager",
  "strapi-plugin-content-type-builder": "@strapi/plugin-content-type-builder",
  "strapi-plugin-documentation": "@strapi/plugin-documentation",
  "strapi-plugin-email": "@strapi/plugin-email",
  "strapi-plugin-graphql": "@strapi/plugin-graphql",
  "strapi-plugin-i18n": "@strapi/plugin-i18n",
  "strapi-plugin-upload": "@strapi/plugin-upload",
  "strapi-plugin-users-permissions": "@strapi/plugin-users-permissions",
  "strapi-utils": "@strapi/utils"
};

async function getLatestStrapiVersion() {
  const response = await axios.get(`https://api.npms.io/v2/package/${encodeURIComponent('@strapi/strapi')}`);
  return response.data.collected.metadata.version;
}

async function updatePackageDependencies(appPath) {
  const packageJSONPath = path.resolve(appPath, 'package.json');
  // Import the app's package.json as an object
  const packageJSON = require(packageJSONPath);
  if (_.isEmpty(packageJSON.dependencies)) {
    console.error(`${appPath} does not have dependencies`)
  }

  // Get the latest Strapi release version
  const latestStrapiVersion = await getLatestStrapiVersion(); 

  // Write all the package JSON changes in a new object
  const v4PackageJSON = _.cloneDeep(packageJSON);
  Object.entries(packageJSON.dependencies).forEach(([depName, depVersion]) => {
    const newStrapiDependency = strapiPackages[depName];
    if (newStrapiDependency) {
      // The dependency is a v3 Strapi package, remove it
      delete v4PackageJSON.dependencies[depName];
      // Replace if it there's a matching v4 package
      if (newStrapiDependency !== toBeDeleted) {
        v4PackageJSON.dependencies[newStrapiDependency] = latestStrapiVersion;
      }
    }
  })

  await fse.writeJSON(packageJSONPath, v4PackageJSON, { spaces: 2 });
}

const args = process.argv.slice(2);

try {
  if (args.length === 0) {
    console.error(
      "No argument provided, please provide the path to your Strapi app"
    );
  }

  if (args.length > 1) {
    console.error(
      "Too many arguments, please only provide the path to your Strapi app"
    );
  }
} catch (error) {
  console.error(error.message);
}

const [appPath] = args;
updatePackageDependencies(appPath);
