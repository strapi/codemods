const moveToServer = require('./move-to-server');
const moveBootstrapFunction = require('./move-bootstrap-function');
const createDirectoryIndex = require('./create-directory-index');
const createServerIndex = require('./create-server-index');
const createContentTypeIndex = require('./create-content-type-index');

module.exports = {
  createDirectoryIndex,
  createServerIndex,
  createContentTypeIndex,
  moveToServer,
  moveBootstrapFunction,
};
