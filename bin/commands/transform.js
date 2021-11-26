// jscodeshift executable
const runJscodeshift = require("../../lib/v4/utils/run-jscodeshift");

// Inquirer engine.
const { prompt, registerPrompt } = require("inquirer");
registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

// global utils
const { utils } = require("../../lib/global");
const { logger } = require("../../lib/global/utils");

const { formatCode } = utils;

const fuzzyPathOptions = {
  type: "fuzzypath",
  excludePath: (nodePath) =>
    nodePath.includes("node_modules") ||
    nodePath.includes("build") ||
    nodePath.match(/^\/?(?:\w+\/)*(\.\w+)/),
  excludeFilter: (nodePath) =>
    nodePath.includes("node_modules") ||
    nodePath.includes("build") ||
    nodePath.match(/^\/?(?:\w+\/)*(\.\w+)/),
  suggestOnly: false,
};

/**
 * Prompt's configuration
 * choices array value have to be the name of transform file
 */
const promptOptions = [
  {
    type: "list",
    name: "type",
    message: "What kind of transformation do you want to perform?",
    choices: [
      { name: "find -> findMany", value: "change-find-to-findMany" },
      {
        name: "strapi-some-package -> @strapi/some-package",
        value: "update-strapi-scoped-imports",
      },
      {
        name: ".models -> .contentTypes",
        value: "change-model-getters-to-content-types",
      },
      {
        name: "strapi.plugins['some-plugin'] -> strapi.plugin('some-plugin')",
        value: "use-plugin-getters",
      },
      {
        name: "strapi.plugin('some-plugin').controllers['some-controller'] -> strapi.plugin('some-plugin').controller('some-controller')",
        value: "update-top-level-plugin-getter",
      },
      {
        name: "Add arrow function for service export",
        value: "use-arrow-function-for-service-export",
      },
      {
        name: "Add strapi to bootstrap function params",
        value: "add-strapi-to-bootstrap-params",
      },
    ],
  },
  {
    ...fuzzyPathOptions,
    name: "path",
    message: (answer) => {
      return answer.type === "use-arrow-function-for-service-export"
        ? "Enter the path to service(s) file(s)/folder"
        : "Enter the path to file(s) or folder to transform";
    },
    itemType: "any",
  },
];

// `strapi-codemods transform`
const transform = async () => {
  try {
    const options = await prompt(promptOptions);

    // execute jscodeshift's Runner
    runJscodeshift(options.path, options.type);

    // format code with prettier
    await formatCode(options.path);
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

module.exports = transform;
