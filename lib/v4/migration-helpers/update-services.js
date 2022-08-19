const { join } = require('path');
const fs = require('fs-extra');

const logger = require('../../global/utils/logger');

/**
 * @description Migrates core services to v4 factories
 *
 * @param {string} apiPath Path to the current api
 * @param {string} apiName Name of the API
 */
module.exports = async (apiPath, apiName, liquidEngine) => {
  const v4ServicePath = join(apiPath, 'services', `${apiName}.js`);

  try {
    // Compile the template
    const template = liquidEngine.renderFileSync('core-service', {
      id: apiName,
      uid: `api::${apiName}.${apiName}`,
    });

    // Create the js file
    await fs.ensureFile(v4ServicePath);

    // Create write stream for new js file
    const file = fs.createWriteStream(v4ServicePath);

    // Export core controllers from handlebars template file
    file.write(template);

    // Close the write stream
    file.end();
  } catch (error) {
    logger.error(`an error occurred when creating factory service file for ${v4ServicePath}`);
    console.log(error);
  }
};