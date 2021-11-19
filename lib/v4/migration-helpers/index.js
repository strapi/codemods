const migrateApiFolder = require("./update-api-folder-structure");
const migrateDependencies = require("./update-package-dependencies");
const migratePlugin = require("./update-plugin-folder-structure");

module.exports = {
  migrateApiFolder,
  migrateDependencies,
  migratePlugin,
};
