const migrate = require("./migrate");
const transform = require("./transform");
const defaultCommand = require("./default");

module.exports = {
  defaultCommand,
  migrate,
  transform,
};
