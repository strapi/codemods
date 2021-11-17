const { resolve, join } = require("path");
const logger = require('./logger')

const isPathStrapiApp = (path) => {
  try {
    const pkgJSON = require(resolve(join(path, "package.json")));
    return pkgJSON.hasOwnProperty("strapi");
  } catch (error) {
    logger.error(error.message);
  }
};

module.exports = isPathStrapiApp;
