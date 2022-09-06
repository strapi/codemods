const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const { Liquid } = require('liquidjs');
const { logger } = require('../../global/utils');

const generateConfig = require('./generate-application-config');

const liquidEngine = new Liquid({
  root: resolve(__dirname, 'templates'),
  extname: '.liquid',
});

const moveDir = async (appPath, folder, srcDir) => {
  const destination =
    folder === 'admin' ? `${join(srcDir, folder)}/extensions` : join(srcDir, folder);

  try {
    await fs.copy(join(appPath, folder), join('v3', folder));
    await fs.move(join(appPath, folder), destination);
  } catch (error) {
    logger.warn(`${basename(appPath)}/${folder} not found, skipping...`);
  }
};

module.exports = async (appPath) => {
  const strapiAppPath = resolve(appPath);
  const srcDir = join(strapiAppPath, 'src');
  const adminPath = join(srcDir, 'admin');
  const configPath = join(strapiAppPath, 'config');
  let databaseType;

  // Do some cleanup on the application folder
  moveDir(strapiAppPath, 'admin', srcDir);
  moveDir(strapiAppPath, 'components', srcDir);
  moveDir(strapiAppPath, 'extensions', srcDir);
  moveDir(strapiAppPath, 'middlewares', srcDir);
  moveDir(strapiAppPath, 'plugins', srcDir);
  moveDir(join(strapiAppPath, 'config'), 'policies', srcDir);

  // Check and generate admin example files if needed
  try {
    // File paths
    const appExamplePath = join(adminPath, 'app.example.js');
    const webpackExamplePath = join(adminPath, 'webpack.config.example.js');

    // Check if folder exists and create it if it doesn't
    await fs.ensureDir(adminPath);

    // Load the templates
    const adminAppExample = await liquidEngine.renderFile(`src-app`);
    const adminWebpackExample = await liquidEngine.renderFile(`src-webpack`);
    const indexExample = await liquidEngine.renderFile(`src-index`);

    // Create the js file
    await fs.ensureFile(appExamplePath);
    await fs.ensureFile(webpackExamplePath);
    await fs.ensureFile(join(srcDir, 'index.js'));

    // Create write stream for new js file
    const appExampleFile = fs.createWriteStream(appExamplePath);
    const webpackExampleFile = fs.createWriteStream(webpackExamplePath);
    const indexExampleFile = fs.createWriteStream(join(srcDir, 'index.js'));

    // Export core controllers from liquid template file
    appExampleFile.write(adminAppExample);
    webpackExampleFile.write(adminWebpackExample);
    indexExampleFile.write(indexExample);

    // Close the write stream
    appExampleFile.end();
    webpackExampleFile.end();
    indexExampleFile.end();
  } catch (error) {
    logger.error(`an error occurred when creating ./src/admin or ./src/index.js example files`);
    console.log(error);
  }

  // Check if config exists
  const configExists = await fs.pathExists(configPath);

  // If config exists, determine database type and move config to v3 folder
  if (configExists) {
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

    logger.info("Don't forget to update your database configuration in ./config/database.js");

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
