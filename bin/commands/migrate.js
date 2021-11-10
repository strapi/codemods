// Node.js core
const { resolve } = require("path");

// Inquirer engine.
const { prompt, registerPrompt } = require("inquirer");
registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

// Migration Helpers
const { v4 } = require("../../lib");
const { migratePlugin, migrateApiFolder, migrateDependencies } =
  v4.migrationHelpers;

const fuzzyPathOptions = {
  type: "fuzzypath",
  excludePath: (nodePath) =>
    nodePath.includes("node_modules") ||
    nodePath.includes("build") ||
    nodePath.match(/(?<=\/)\./),
  excludeFilter: (nodePath) =>
    nodePath.includes("node_modules") ||
    nodePath.includes("build") ||
    nodePath.match(/(?<=\/)\./),
  suggestOnly: false,
  itemType: "directory",
  depthLimit: 2,
};

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
    ...fuzzyPathOptions,
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
      ...fuzzyPathOptions,
      name: "pathForV4",
      message: "Where would you like to create your v4 plugin?",
      default: `${pathToV3}-v4`,
    },
  ];
};

const migrateWithFlags = async (options) => {
  if (options.project) {
    await migrateApiFolder(options.project);
    await migrateDependencies(options.project);
  }
  if (options.dependencies) {
    await migrateDependencies(options.dependencies);
  }
  if (options.plugin) {
    const pathForV4Plugin = resolve(`${options.plugin}-v4`);
    await migratePlugin(options.plugin, pathForV4Plugin);
  }
};

// `strapi-codemods migrate`
const migrate = async (options) => {
  try {
    // Use bypass in order to migrate & don't have the prompt
    if (
      options &&
      (options.project || options.dependencies || options.plugin)
    ) {
      await migrateWithFlags(options);
      process.exit(0);
    }

    const response = await prompt(promptOptions);

    switch (response.type) {
      case "project":
        await migrateApiFolder(response.path);
        await migrateDependencies(response.path);
        break;
      case "dependencies":
        await migrateDependencies(response.path);
        break;
      case "plugin":
        const pluginResponse = await prompt(
          pluginPromptOptions(resolve(response.path))
        );
        await migratePlugin(response.path, resolve(pluginResponse.pathForV4));
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = migrate;
