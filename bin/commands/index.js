const {
  migrate,
  migrateApplicationToV4,
  migrateDependenciesToV4,
  migratePluginToV4,
} = require("./migrate");
const transform = require("./transform");
const defaultCommand = require("./default");

module.exports = {
  defaultCommand,
  transform,
  migrate,
  migrateApplicationToV4,
  migrateDependenciesToV4,
  migratePluginToV4,
};
