const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const { Liquid } = require('liquidjs');
const { logger } = require('../../global/utils');

const generateConfig = require('./generate-application-config');

const liquidEngine = new Liquid({
  root: resolve(__dirname, 'templates'),
  extname: '.liquid'
})

const moveDir = async (appPath, folder, srcDir) => {
  const destination =
    folder === 'admin' ? `${join(srcDir, folder)}/extensions` : join(srcDir, folder);
		
  try {
    await fs.copy(join(appPath, folder), join('v3', folder));
    await fs.move(join(appPath, folder), destination)
  } catch (error) {
    logger.warn(`${basename(appPath)}/${folder} not found, skipping...`);
  }
};

module.exports = async (appPath) => {
  const strapiAppPath = resolve(appPath);
	const srcDir = join(strapiAppPath, 'src')
  const configPath = join(strapiAppPath, 'config');
  let databaseType;

  // Do some cleanup on the application folder
	moveDir(strapiAppPath, 'admin', srcDir)
	moveDir(strapiAppPath, 'components', srcDir)
	moveDir(strapiAppPath, 'extensions', srcDir)
	moveDir(strapiAppPath, 'middlewares', srcDir)
	moveDir(strapiAppPath, 'plugins', srcDir)
	moveDir(join(strapiAppPath, 'config'), 'policies', srcDir);

  // Check if config exists
  const configExists = await fs.pathExists(configPath);

  // If config exists, determine database type and move config to v3 folder
  if (configExists === true) {
    // Determine database type
    const v3DatabaseConfig = require(join(strapiAppPath, 'config', 'database.js')).toString();

    // Set database type based on existing config
    if (v3DatabaseConfig.search(/sqlite/) > -1) {
      databaseType = 'sqlite';
    } else if (v3DatabaseConfig.search(/mysql/) > -1) {
      databaseType = 'mysql';
    } else if (v3DatabaseConfig.search(/postgres/) > -1) {
      databaseType = 'postgres';
    } else {
      logger.error(`unable to determine database type, please update config/database.js`);
      process.exit(1);
    }

    // Move existing config to v3 folder for safe keeping
    await fs.move(configPath, join(strapiAppPath, 'v3', 'config'));
  } else {
    // Set default migration database type
    databaseType = 'sqlite';
  }

  // Ensure config folder exists
  await fs.ensureDir(configPath);

  // Generate new config based on v4 structure
  await generateConfig(configPath, databaseType, liquidEngine);
};
