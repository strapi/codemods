const { join } = require('path');
const fs = require('fs-extra');

const logger = require('../../global/utils/logger');

/**
 * @description Migrates core routers to v4 factories
 *
 * @param {string} apiPath Path to the current api
 * @param {string} apiName Name of the API
 * @param {function} liquidEngine Liquid engine to use for templating
 */
module.exports = async (apiPath, apiName, liquidEngine) => {
  const v4RouterPath = join(apiPath, 'routes', `${apiName}.js`);

  try {
    // Compile the template
    const template = liquidEngine.renderFileSync('core-router', {
      id: apiName,
      uid: `api::${apiName}.${apiName}`,
    });

    // Create the js file
    await fs.ensureFile(v4RouterPath);

    // Create write stream for new js file
    const file = fs.createWriteStream(v4RouterPath);

    // Export core controllers from liquid template file
    file.write(template);

    // Close the write stream
    file.end();

    // Delete the v3 config/routes.json
    await fs.remove(join(apiPath, 'config', 'routes.json'));

  } catch (error) {
    logger.error(`an error occurred when creating factory router file for ${v4RouterPath}`);
    console.log(error);
  }
};