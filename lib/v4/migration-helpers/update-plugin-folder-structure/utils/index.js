const { join } = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const { logger } = require('../../../../global/utils');

const { importFilesToIndex, addModulesToExport } = require('../transforms');
const runJscodeshift = require('../../../utils/run-jscodeshift');

async function moveToServer(v4Plugin, originDir, serverDir) {
  const exists = await fs.pathExists(join(v4Plugin, originDir, serverDir));
  if (!exists) return;

  const origin = join(v4Plugin, originDir, serverDir);
  const destination = join(v4Plugin, 'server', serverDir);
  await fs.move(origin, destination);

  const destinationLog =
    serverDir === 'models' ? join(v4Plugin, 'server', 'content-types') : destination;
  logger.info(`moved ${chalk.yellow(serverDir)} to ${chalk.yellow(destinationLog)}`);
}

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, 'index.js');
  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);

  const dirContent = await fs.readdir(serverDir);
  const filesToImport = dirContent.filter((file) => file !== 'index.js');

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function createContentTypeIndex(v4PluginPath, dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, 'index.js');

  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);
  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const directoriesToImport = dirContent.filter((fd) => fd.isDirectory()).map((fd) => fd.name);

  for (dir of directoriesToImport) {
    createDirectoryIndex(join(v4PluginPath, 'server', 'content-types', dir));
  }

  await importFilesToIndex(indexPath, directoriesToImport);
  await addModulesToExport(indexPath, directoriesToImport);
}

async function createDirectoryIndex(dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, 'index.js');

  await fs.copy(join(__dirname, '..', 'utils', 'module-exports.js'), indexPath);

  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const filesToImport = dirContent
    .filter((fd) => fd.isFile() && fd.name !== 'index.js')
    .map((file) => file.name);

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

async function moveBootstrapFunction(pluginPath) {
  await moveToServer(pluginPath, join('config', 'functions'), 'bootstrap.js');

  const functionsDir = join(pluginPath, 'config', 'functions');
  const dirContent = await fs.readdir(functionsDir);

  runJscodeshift(join(pluginPath, 'server', 'bootstrap.js'), 'add-strapi-to-bootstrap-params');

  if (!dirContent.length) {
    await fs.remove(functionsDir);
  }
}

module.exports = {
  createDirectoryIndex,
  createServerIndex,
  createContentTypeIndex,
  moveToServer,
  moveBootstrapFunction
};
