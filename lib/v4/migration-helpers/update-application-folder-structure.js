const { resolve, join, basename } = require('path');
const fs = require('fs-extra');
const { logger } = require('../../global/utils');

const moveDir = async (appPath, folder, srcDir) => {
  try {
    await fs.copy(join(appPath, folder), srcDir);
  } catch (error) {
    logger.info(`${basename(appPath)}/${folder} not found, skipping...`);
  }
};

module.exports = async (appPath) => {
  const strapiAppPath = resolve(appPath);
	const srcDir = join(strapiAppPath, 'src')

	moveDir(strapiAppPath, 'admin', srcDir)
	moveDir(strapiAppPath, 'components', srcDir)
	moveDir(strapiAppPath, 'extensions', srcDir)
	moveDir(strapiAppPath, 'middlewares', srcDir)
	moveDir(strapiAppPath, 'plugins', srcDir)
	moveDir(strapiAppPath, 'policies', srcDir);
};