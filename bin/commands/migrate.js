// Node.js core
const { resolve } = require("path");

// Inquirer engine.
const { prompt } = require("inquirer");

// Migration Helpers
const { v4 } = require("../../lib");
const { migratePlugin, migrateApiFolder, migrateDependencies } =
  v4.migrationHelpers;

// Global utils
const { utils } = require("../../lib/global");
const { isPathStrapiApp } = utils;

// Prompt's configuration
const promptOptions = [
  {
    type: "list",
    name: "type",
    message: "What do you want to migrate?",
    choices: [
      { name: "Project", value: "project" },
      { name: "Only Dependencies", value: "dependencies" },
      { name: "Plugin", value: "plugin" },
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

const checkIsValidPath = async (path) => {
  const options = [
    {
      type: "input",
      name: "path",
      message:
        "The specified path is not a Strapi application. Please provide a correct one",
    },
  ];

  if (!isPathStrapiApp(path)) {
    const response = await prompt(options);

    // Give a last chance to specify a valid Strapi application
    if (!isPathStrapiApp(response.path)) {
      console.error("It is still not a Strapi application...");
      process.exit(1);
    }
    return response.path;
  }
  return path;
};

const migrateWithFlags = async (options) => {
  if (options.project) {
    const path = await checkIsValidPath(options.project);
    await migrateApiFolder(path);
    await migrateDependencies(path);
  }
  if (options.dependencies) {
    const path = await checkIsValidPath(options.dependencies);
    await migrateDependencies(path);
  }
  if (options.plugin) {
    const pathForV4Plugin = resolve(`${options.plugin}-v4`);
    await migratePlugin(options.plugin, pathForV4Plugin);
  }
  process.exit(0);
};

// `strapi-codemods migrate`
const migrate = async (options) => {
  try {
    // Use flags to bypass prompts
    if (
      options &&
      (options.project || options.dependencies || options.plugin)
    ) {
      await migrateWithFlags(options);
    }

    const response = await prompt(promptOptions);

    let path;
    switch (response.type) {
      case "project":
        path = await checkIsValidPath(response.path);
        await migrateApiFolder(path);
        await migrateDependencies(path);
        break;
      case "dependencies":
        path = await checkIsValidPath(response.path);
        await migrateDependencies(path);
        break;
      case "plugin":
        path = response.path;
        const pluginResponse = await prompt(pluginPromptOptions(resolve(path)));
        await migratePlugin(path, resolve(pluginResponse.pathForV4));
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = migrate;
