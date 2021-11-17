// Node.js core
const { resolve } = require("path");

// Inquirer engine.
const { prompt } = require("inquirer");

// Migration Helpers
const { v4 } = require("../../lib");
const { migratePlugin, migrateApiFolder, migrateDependencies } =
  v4.migrationHelpers;

// Global utils
const { isPathStrapiApp, logger } = require("../../lib/global/utils");

// Prompt's configuration
const defaultPromptOptions = [
  {
    type: "list",
    name: "type",
    message: "What do you want to migrate?",
    choices: [
      { name: "Application", value: "application" },
      { name: "Plugin", value: "plugin" },
      { name: "Only Dependencies", value: "dependencies" },
    ],
  },
  {
    type: "input",
    name: "path",
    message: (answer) => {
      return answer.type === "plugin"
        ? "Enter the path to your Strapi plugin"
        : "Enter the path to your Strapi application";
    },
  },
];

const pluginPromptOptions = (pathToV3) => {
  return [
    {
      type: "input",
      name: "pathForV4",
      message: "Where would you like to create your v4 plugin?",
      default: `${pathToV3}-v4`,
    },
  ];
};

const checkIsValidPath = (path) => {
  if (!isPathStrapiApp(path)) {
    logger.error(
      "The specified path is not a Strapi project. Please check the path and try again."
    );

    process.exit(1);
  }
};

// `strapi-codemods migrate`
const migrate = async (options, type) => {
  
  const promptOptions = options || defaultPromptOptions
  try {
    const response = await prompt(promptOptions);
    const migrationType = type || response.type
    
    switch (migrationType) {
      case "application":
        await checkIsValidPath(response.path);
        await migrateApiFolder(response.path);
        await migrateDependencies(response.path);
        break;
      case "dependencies":
        await checkIsValidPath(response.path);
        await migrateDependencies(response.path);
        break;
      case "plugin":
        await checkIsValidPath(response.path);
        const pluginResponse = await prompt(
          pluginPromptOptions(resolve(response.path))
        );
        await migratePlugin(response.path, resolve(pluginResponse.pathForV4));
        break;
    }
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

// `strapi-codemods migrate:application`
const migrateApplicationToV4 = async (path) => {
  if (!path) {
    const promptOptions = {
      type: "input",
      name: "path",
      message: "Enter the path to your Strapi application",
    };

    return migrate(promptOptions, 'application');
  }

  await checkIsValidPath(path);
  await migrateApiFolder(path);
  await migrateDependencies(path);
};

// `strapi-codemods migrate:plugin`
const migratePluginToV4 = async (path, pathForV4) => {
  if (!path) {
    const promptOptions = {
      type: "input",
      name: "path",
      message: "Enter the path to your Strapi plugin",
    };

    return migrate(promptOptions, 'plugin');
  }

  await checkIsValidPath(path);
  const pathForV4Plugin = pathForV4
    ? resolve(pathForV4)
    : resolve(`${path}-v4`);

  await migratePlugin(path, pathForV4Plugin);
};

// `strapi-codemods migrate:dependencies`
const migrateDependenciesToV4 = async (path) => {
  if (!path) {
    const promptOptions = {
      type: "input",
      name: "path",
      message: "Enter the path to your Strapi application or plugin",
    };

    return migrate(promptOptions, 'dependencies');
  }

  await checkIsValidPath(path);
  await migrateDependencies(path);
};

module.exports = {
  migrate,
  migrateApplicationToV4,
  migratePluginToV4,
  migrateDependenciesToV4,
};
