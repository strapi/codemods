const { resolve, join } = require('path');
const logger = require('./logger');

const isPathStrapiApp = (path) => {
  try {
    const pkgJSON = require(resolve(join(path, 'package.json')));
    return 'strapi' in pkgJSON;
  } catch (error) {
    logger.error(
      'The specified path is not a Strapi project. Please check the path and try again.'
    );
    process.exit(1)
  }
};

module.exports = isPathStrapiApp;
