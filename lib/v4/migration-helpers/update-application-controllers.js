const { join } = require('path');
const fs = require('fs-extra');

const logger = require('../../global/utils/logger');

/**
 * @description Migrates core controllers to v4 factories
 *
 * @param {string} apiPath Path to the current api
 * @param {string} apiName Name of the API
 * @param {function} liquidEngine Liquid engine to use for templating
 */
module.exports = async (apiPath, apiName, liquidEngine) => {
  const v4ControllerPath = join(apiPath, 'controllers', `${apiName}.js`);

  try {
    // Compile the template
    const template = liquidEngine.renderFileSync('core-controller', {
      id: apiName,
      uid: `api::${apiName}.${apiName}`,
    });

    // Create the js file
    await fs.ensureFile(v4ControllerPath);

    // Create write stream for new js file
    const file = fs.createWriteStream(v4ControllerPath);

    // Export core controllers from liquid template file
    file.write(template);

    // Close the write stream
    file.end();
  } catch (error) {
    logger.error(`an error occurred when creating factory controller file for ${v4ControllerPath}`);
    console.log(error);
  }
};
