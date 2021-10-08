/**
 * Migrate API folder structure to v4
 */

const { resolve, join, basename } = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const pluralize = require("pluralize")
const { inspect } = require("util");
const runJsCodeshift = require("../utils/runJsCodeshift");

const normalizeName = _.kebabCase;

/**
 * @description Migrates settings.json to schema.json
 *
 * @param {string} apiPath Path to the current api
 * @param {string} contentTypeName Name of the current contentType
 */
const convertModelToContentType = async (apiPath, contentTypeName) => {
  const settingsJsonPath = join(
    apiPath,
    "models",
    `${contentTypeName}.settings.json`
  );

  const exists = await fs.exists(settingsJsonPath);
  if (!exists) {
    console.error(`error: ${contentTypeName}.settings.json does not exist`);
    return;
  }

  const v4SchemaJsonPath = join(
    apiPath,
    "content-types",
    contentTypeName,
    "schema.json"
  );

  try {
    // Read the settings.json file
    const settingsJson = await fs.readJson(settingsJsonPath);
    // Create a copy
    const schemaJson = { ...settingsJson };
    const infoUpdate = {
      singularName: pluralize.singular(contentTypeName),
      pluralName: pluralize(contentTypeName),
      displayName: _.upperFirst(contentTypeName),
      name: contentTypeName,
    };
    // Modify the JSON
    _.set(schemaJson, "info", infoUpdate);
    // Create the new content-types/api/schema.json file
    await fs.ensureFile(v4SchemaJsonPath);
    // Write modified JSON to schema.json
    await fs.writeJSON(v4SchemaJsonPath, schemaJson, {
      spaces: 2,
    });
  } catch (error) {
    console.error(
      `error: an error occured when migrating the model at ${settingsJsonPath} to a contentType at ${v4SchemaJsonPath} `
    );
  }
};

/**
 * 
 * @param {string} apiPath Path to the current API
 */
const updateContentTypes = async (apiPath) => {
  const allModels = await fs.readdir(join(apiPath, "models"), {
    withFileTypes: true,
  });
  const allModelFiles = allModels.filter(
    (f) => f.isFile() && f.name.includes("settings")
  );

  if (!allModelFiles.length) {
    await fs.remove(join(apiPath, "models"));
  }

  for (const model of allModelFiles) {
    const [contentTypeName] = model.name.split(".");
    await convertModelToContentType(apiPath, contentTypeName);
  }

  // all models have been deleted, remove the directory
  await fs.remove(join(apiPath, "models"));
};

/**
 * @description Migrates settings.json to schema.json
 *
 * @param {string} apiPath Path to the current api
 * @param {string} apiName Name of the API
 */
const updateRoutes = async (apiPath, apiName) => {
  const v3RoutePath = join(apiPath, "config", "routes.json");
  const v4RoutePath = join(apiPath, "routes", `${apiName}.js`);
  try {
    // Create the js file
    await fs.ensureFile(v4RoutePath);

    // Create write stream for new js file
    const file = fs.createWriteStream(v4RoutePath);
    // Get the existing JSON routes file
    const routesJson = await fs.readJson(v3RoutePath);
    const { routes } = routesJson;

    // Remove count
    const updatedRoutes = routes.filter(
      (route) =>
        !route.handler.includes("count") || !route.path.includes("count")
    );

    // Transform objects to strings
    const routesToString = inspect(
      { routes: updatedRoutes },
      { depth: Infinity }
    );

    // Export routes from create js file
    file.write(`module.exports = ${routesToString}`);

    // Close the write stream
    file.end();

    // Delete the v3 config/routes.json
    await fs.remove(join(apiPath, "config", "routes.json"));
  } catch (error) {
    console.error(
      `error: an error occured when migrating routes from ${v3RoutePath} to ${v4RoutePath}`
    );
  }
};

/**
 *
 * @param {string} apiPath Path to the current api
 */
const updatePolicies = async (apiPath) => {
  const v3PoliciesPath = join(apiPath, "config", "policies");

  const exists = await fs.exists(v3PoliciesPath);
  if (!exists) return;

  const v3Policies = await fs.readdir(v3PoliciesPath, { withFileTypes: true });
  const policyFiles = v3Policies.filter((fd) => fd.isFile());

  if (!policyFiles.length) {
    await fs.remove(v3PoliciesPath);
  }

  const v4PoliciesPath = join(apiPath, "policies");
  try {
    for (const policy of policyFiles) {
      await fs.copy(
        join(v3PoliciesPath, policy.name),
        join(v4PoliciesPath, policy.name)
      );
    }
    // delete the v3 policy folder
    await fs.remove(v3PoliciesPath);
  } catch (error) {
    console.error(
      `error: an error occured when migrating a policy from ${v3PoliciesPath} to ${v4PoliciesPath}`
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
  for (dir of dirs) {
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
      console.error("error: failed to remove empty directories");
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
    await fs.remove(join(strapiAppPath, "api"));
    // Rename the api-copy folder api
    await fs.rename(apiDirCopyPath, join(strapiAppPath, "src", "api"));
  } catch (error) {
    console.error(
      `error: failed to rename the api folder, check: ${apiDirCopyPath}`
    );
    console.error(error.message);
  }
};

const updateApiFolderStructure = async (appPath) => {
  const strapiAppPath = resolve(appPath);
  const apiDirCopyPath = join(strapiAppPath, "src", "api-copy");

  try {
    await fs.copy(join(strapiAppPath, "api"), apiDirCopyPath);
  } catch (error) {
    console.error(
      `error: ${basename(
        strapiAppPath
      )}/api not found, are you sure this is a Strapi app?`
    );
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
    runJsCodeshift(
      join(apiDirCopyPath, apiName, "services"),
      "use-arrow-function-for-service-export"
    );
  }

  console.log(`migrated ${basename(strapiAppPath)}/api to Strapi v4`);
  console.log(`to see changes: Run "git add . && git diff --cached"`);
  console.log('to revert: "git reset HEAD --hard && git cleanEmptyDirectories -fd"');
  console.log('to accept: "git commit -am "migrate API to v4 structure""');

  await cleanEmptyDirectories(apiDirs, apiDirCopyPath);
  await renameApiFolder(apiDirCopyPath, strapiAppPath);
};

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
  updateApiFolderStructure(appPath);
} catch (error) {
  console.error(error.message);
}
