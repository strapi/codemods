const { resolve, join } = require("path");

const isPathStrapiApp = (path) => {
  try {
    const pkgJSON = require(resolve(join(path, "package.json")));

    if (!pkgJSON.dependencies.hasOwnProperty("strapi")) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = isPathStrapiApp;
