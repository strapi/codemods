const { join, extname } = require('path');
const prettier = require('prettier');
const { readFile, writeFile, readdir, lstat } = require('fs-extra');
const logger = require('./logger');

const formatFile = async (path) => {
  try {
    const fileContent = await readFile(path, 'utf-8');
    // Format the code with prettier
    return writeFile(
      path, fileContent
//       prettier.format(fileContent, {
//         filepath: path,
//       })
    );
  } catch (error) {
    logger.warn(`Failed to format code, check ${path}`);
  }
};

/**
 * @description Recursively walks a directory to format code
 * @param {path} path - path to file or directory
 */
const formatCode = async (path) => {
  // Determine if path is a file
  const pathStats = await lstat(path);
  if (pathStats.isFile() && extname(path) === '.js') {
    return formatFile(path);
  }

  // Get content of directory
  const dirContent = await readdir(path, { withFileTypes: true });
  for (const item of dirContent) {
    if (item.isFile() && extname(item.name) === '.js') {
      const filePath = join(path, item.name);
      return formatFile(filePath);
    }

    if (item.isDirectory()) {
      await formatCode(join(path, item.name));
    }
  }
};

module.exports = formatCode;
