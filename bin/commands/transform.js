// jscodeshift executable
const { prompt, registerPrompt } = require('inquirer');
const runJscodeshift = require('../../lib/v4/utils/run-jscodeshift');

// Inquirer engine.
registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));

// global utils
const { utils } = require('../../lib/global');
const { logger } = require('../../lib/global/utils');

const { formatCode } = utils;

const fuzzyPathOptions = {
  type: 'fuzzypath',
  excludePath: (nodePath) =>
    nodePath.includes('node_modules') ||
    nodePath.includes('build') ||
    // Exclude all dot files
    nodePath.match(/^\/?(?:\w+\/)*(\.\w+)/),
  excludeFilter: (nodePath) =>
    nodePath.includes('node_modules') ||
    nodePath.includes('build') ||
    // Exclude all dot files
    nodePath.match(/^\/?(?:\w+\/)*(\.\w+)/),
  suggestOnly: false,
};

const fuzzyPromptOptions = {
  ...fuzzyPathOptions,
  name: 'path',
  message: 'Enter the path to a file or folder',
  itemType: 'any',
};

/**
 * Prompt's configuration
 * choices array value have to be the name of transform file
 */
const promptOptions = [
  {
    type: 'list',
    name: 'type',
    message: 'What kind of transformation do you want to perform?',
    choices: [
      { name: 'find -> findMany', value: 'change-find-to-findMany' },
      {
        name: 'strapi-some-package -> @strapi/some-package',
        value: 'update-strapi-scoped-imports',
      },
      {
        name: '.models -> .contentTypes',
        value: 'change-model-getters-to-content-types',
      },
      {
        name: "strapi.plugins['some-plugin'] -> strapi.plugin('some-plugin')",
        value: 'use-plugin-getters',
      },
      {
        name: "strapi.plugin('some-plugin').controllers['some-controller'] -> strapi.plugin('some-plugin').controller('some-controller')",
        value: 'update-top-level-plugin-getter',
      },
      {
        name: 'Convert object export to function export',
        value: 'convert-object-export-to-function',
      },
      {
        name: 'Add strapi to bootstrap function params',
        value: 'add-strapi-to-bootstrap-params',
      },
    ],
  },
  fuzzyPromptOptions,
];

// `strapi-codemods transform`
const transform = async (transform, path) => {
  try {
    let args;
    if (transform && path) {
      // Use provided arguments
      args = { path, type: transform };
    } else if (transform && !path) {
      // Use provided transform and ask for path
      const response = await prompt(fuzzyPromptOptions);
      args = { path: response.path, type: transform };
    } else if (!transform && !path) {
      // Ask for everything
      args = await prompt(promptOptions);
    }

    // execute jscodeshift's Runner
    await runJscodeshift(args.path, args.type, { stdio: 'inherit', cwd: process.cwd() });

    // format code with prettier
    await formatCode(args.path);
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

module.exports = transform;
