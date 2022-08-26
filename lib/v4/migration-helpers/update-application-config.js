const { join } = require('path');
const fs = require('fs-extra');

const logger = require('../../global/utils/logger');

/**
 * @description Migrates v3 config structure to v4 structure
 *
 * @param {string} configPath Path to the config folder
 * @param {string} database Database Type
 * @param {function} liquidEngine Liquid engine to use for templating
 */
module.exports = async (configPath, database, liquidEngine) => {
  const files = ['admin', 'api', 'database', 'middlewares', 'plugins', 'server'];

  let paths = {};

  files.forEach((file) => {
    paths[file] = join(configPath, file);
  });
  
  try {
    // create config path
    fs.mkdirSync(configPath);
  } catch (error) {
    logger.error(`an error occurred when creating ${configPath} folder`);
    console.log(error);
  }

  for (const jsFile in files) {
    let template;

    const fileName = files[jsFile];

    try {
      // Compile the template
      if (fileName !== 'database') {
        template = liquidEngine.renderFileSync(`config-${fileName}`);
      } else {
        template = liquidEngine.renderFileSync(`config-${fileName}-${database}`);
      }

      // Create the js file
      await fs.ensureFile(`${paths[fileName]}.js`);

      // Create write stream for new js file
      const file = fs.createWriteStream(`${paths[fileName]}.js`);

      // Export core controllers from liquid template file
      file.write(template);

      // Close the write stream
      file.end();
    } catch (error) {
      logger.error(`an error occurred when migrating ${fileName} config file`);
      console.log(error);
    }
  }
};
