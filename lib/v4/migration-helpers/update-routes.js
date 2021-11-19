const { join } = require("path");
const fs = require("fs-extra");
const { inspect } = require("util");

/**
 * @description Migrates settings.json to schema.json
 *
 * @param {string} apiPath Path to the current api
 * @param {string} apiName Name of the API
 */
module.exports = async (apiPath, apiName) => {
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
