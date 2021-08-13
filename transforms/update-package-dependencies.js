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
  "strapi-database": "@strapi/database",
  "strapi-generate": "@strapi/generate",
  "strapi-generate-api": "@strapi/generate-api",
  "strapi-generate-controller": "@strapi/generate-controller",
  "strapi-generate-model": "@strapi/generate-model",
  "strapi-generate-new": "@strapi/generate-new",
  "strapi-generate-plugin": "@strapi/generate-plugin",
  "strapi-generate-policy": "@strapi/generate-policy",
  "strapi-generate-service": "@strapi/generate-service",
  "strapi-helper-plugin": "@strapi/helper-plugin",
  "strapi-hook-ejs": toBeDeleted,
  "strapi-hook-redis": toBeDeleted,
  "strapi-middleware-views": toBeDeleted,
  "strapi-plugin-content-manager": "@strapi/plugin-content-manager",
  "strapi-plugin-content-type-builder": "@strapi/plugin-content-type-builder",
  "strapi-plugin-documentation": "@strapi/plugin-documentation",
  "strapi-plugin-email": "@strapi/plugin-email",
  "strapi-plugin-graphql": "@strapi/plugin-graphql",
  "strapi-plugin-i18n": "@strapi/plugin-i18n",
  "strapi-plugin-sentry": "@strapi/plugin-sentry",
  "strapi-plugin-upload": "@strapi/plugin-upload",
  "strapi-plugin-users-permissions": "@strapi/plugin-users-permissions",
  "strapi-provider-amazon-ses": "@strapi/provider-email-amazon-ses",
  "strapi-provider-email-mailgun": "@strapi/provider-email-mailgun",
  "strapi-provider-email-nodemailer": "@strapi/provider-email-nodemailer",
  "strapi-provider-email-sendgrid": "@strapi/provider-email-sendgrid",
  "strapi-provider-email-sendmail": "@strapi/provider-email-sendmail",
  "strapi-provider-upload-aws-s3": "@strapi/provider-upload-aws-s3",
  "strapi-provider-upload-cloudinary": "@strapi/provider-upload-cloudinary",
  "strapi-provider-upload-local": "@strapi/provider-upload-local",
  "strapi-provider-upload-rackspace": "@strapi/provider-upload-rackspace",
  "strapi-utils": "@strapi/utils",
};

async function getLatestStrapiVersion() {
  const response = await axios.get(`https://api.npms.io/v2/package/${encodeURIComponent('@strapi/strapi')}`);
  return response.data.collected.metadata.version;
}

async function updatePackageDependencies(appPath) {
  // Import the app's package.json as an object
  const packageJSONPath = path.resolve(appPath, 'package.json');
  let packageJSON;
  try {
    packageJSON = require(packageJSONPath);
  } catch (error) {
    throw Error('Could not find a package.json. Are you sure this is a Strapi app?');
  }
  if (_.isEmpty(packageJSON.dependencies)) {
    throw Error(`${appPath} does not have dependencies`)
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
      if (newStrapiDependency === toBeDeleted) {
        // Warn user if the dependency doesn't exist anymore
        console.warn(`warning: ${depName} does not exist anymore in Strapi v4`)
      } else {
        // Replace dependency if there's a matching v4 package
        v4PackageJSON.dependencies[newStrapiDependency] = latestStrapiVersion;
        
      }
    }
  })

  await fse.writeJSON(packageJSONPath, v4PackageJSON, { spaces: 2 });
}

const args = process.argv.slice(2);

try {
  if (args.length === 0) {
    throw Error(
      "No argument provided, please provide the path to your Strapi app"
    );
  }

  if (args.length > 1) {
    throw Error(
      "Too many arguments, please only provide the path to your Strapi app"
    );
  }

  const [appPath] = args;
  updatePackageDependencies(appPath);
} catch (error) {
  console.error(error.message);
}

