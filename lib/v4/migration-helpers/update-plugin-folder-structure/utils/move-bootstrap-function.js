const { join } = require('path');
const fs = require('fs-extra');

const runJscodeshift = require('../../../utils/run-jscodeshift');
const moveToServer = require('./move-to-server');

async function moveBootstrapFunction(pluginPath) {
  await moveToServer(pluginPath, join('config', 'functions'), 'bootstrap.js');

  const functionsDir = join(pluginPath, 'config', 'functions');
  const dirContent = await fs.readdir(functionsDir);

  await runJscodeshift(join(pluginPath, 'server', 'bootstrap.js'), 'add-strapi-to-bootstrap-params');

  if (!dirContent.length) {
    await fs.remove(functionsDir);
  }
}

module.exports = moveBootstrapFunction;
