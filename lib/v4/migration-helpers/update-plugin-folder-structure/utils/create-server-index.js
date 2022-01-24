const { join } = require('path');
const fs = require('fs-extra');

const { importFilesToIndex, addModulesToExport } = require('../transforms');

async function createServerIndex(serverDir) {
  const indexPath = join(serverDir, 'index.js');
  await fs.copy(join(__dirname, '..', '..', '..', 'utils', 'module-exports.js'), indexPath);

  const dirContent = await fs.readdir(serverDir);
  const filesToImport = dirContent.filter((file) => file !== 'index.js');

  await importFilesToIndex(indexPath, filesToImport);
  await addModulesToExport(indexPath, filesToImport);
}

module.exports = createServerIndex;
