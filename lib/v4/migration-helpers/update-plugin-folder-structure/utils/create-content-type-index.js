const { join } = require('path');
const fs = require('fs-extra');

const { importFilesToIndex, addModulesToExport } = require('../transforms');

const createDirectoryIndex = require('./create-directory-index');

async function createContentTypeIndex(v4PluginPath, dir) {
  const hasDir = await fs.pathExists(dir);
  if (!hasDir) return;

  const indexPath = join(dir, 'index.js');

  await fs.copy(join(__dirname, '..', '..', '..', 'utils', 'module-exports.js'), indexPath);
  const dirContent = await fs.readdir(dir, { withFileTypes: true });
  const directoriesToImport = dirContent.filter((fd) => fd.isDirectory()).map((fd) => fd.name);

  for (const directory of directoriesToImport) {
    createDirectoryIndex(join(v4PluginPath, 'server', 'content-types', directory));
  }

  await importFilesToIndex(indexPath, directoriesToImport);
  await addModulesToExport(indexPath, directoriesToImport);
}

module.exports = createContentTypeIndex;
