const { join } = require("path");
const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");
const execa = require("execa");

/**
 * @description Executes jscodeshift
 *
 * @param {string} path - the path where the transform should run
 * @param {string} transform - the name of the transform file
 * @param {object} options - execa options
 */
module.exports = (path, transform, options) => {
  const result = execa.sync(
    jscodeshiftExecutable,
    ["-t", join(__dirname, "..", "transforms", `${transform}.js`), path],
    options
  );

  if (result.error) {
    throw result.error;
  }
};
