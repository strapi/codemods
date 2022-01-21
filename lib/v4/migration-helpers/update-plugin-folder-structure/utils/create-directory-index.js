const { join } = require('path');
const fs = require('fs-extra');

const { importFilesToIndex, addModulesToExport } = require('../transforms');

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

module.exports = createDirectoryIndex;
