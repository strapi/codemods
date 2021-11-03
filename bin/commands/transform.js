// Node.js core.
const { join } = require("path");

// jscodeshift engine
const jscodeshift = require("jscodeshift/dist/Runner");

// Enquirer engine.
const { prompt } = require("enquirer");

// global utils
const { utils } = require("../../lib/global");
const { formatCode } = utils;

/**
 * Prompt's configuration
 * choices array value have to be name of transform file
 */
const promptOptions = [
  {
    type: "select",
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
    result() {
      return this.focused.value;
    },
  },
  {
    type: "input",
    name: "path",
    message: "Enter the path to file(s) or folder to transform",
  },
];

// `strapi-codemods transform`
const transform = async () => {
  try {
    const options = await prompt(promptOptions);

    // execute jscodeshift's Runner
    jscodeshift.run(
      join(__dirname, "../../lib/v4/transforms", `${options.type}.js`),
      [options.path],
      {}
    );

    // format code with prettier
    await formatCode(options.path);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = transform;
