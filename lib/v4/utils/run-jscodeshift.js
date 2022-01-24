const { join } = require('path');

const jscodeshiftExecutable = require.resolve('.bin/jscodeshift');
const execa = require('execa');
const { logger } = require('../../global/utils');

/**
 * @description Executes jscodeshift
 *
 * @param {string} path - the path where the transform should run
 * @param {string} transform - the name of the transform file
 * @param {object} options - execa options
 */
module.exports = async (path, transform, options) => {
  try {
    return execa(
      jscodeshiftExecutable,
      ['-t', join(__dirname, '..', 'transforms', `${transform}.js`), path],
      options
    );
  } catch (error) {
    logger.error(error.message);
    process.exit(1)
  }
};
