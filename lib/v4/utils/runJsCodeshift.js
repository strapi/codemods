const { join } = require("path");
const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");
const execa = require("execa");

/**
 * @description Executes jscodeshift
 *
 * @param {string} path - the path where the transform should run
 * @param {string} transform - the name of the transform file
 */
module.exports = (path, transform) => {
  const result = execa.sync(jscodeshiftExecutable, [
    "-t",
    join(__dirname, "..", "transforms", `${transform}.js`),
    path,
  ]);

  if (result.error) {
    throw result.error;
  }
};
