// Node.js core.
const { join } = require("path");

// Enquirer engine.
const { prompt } = require("enquirer");

// Migration Helpers
const {
  migratePlugin,
  migrateApiFolder,
  migrateDependencies,
} = require("../../lib/migration-helpers");

// Prompt's configuration
const promptOptions = [
  {
    type: "select",
    name: "type",
    message: "What do you want to migrate?",
    choices: [
      { name: "Project", value: "project" },
      { name: "Only Dependencies", value: "dependencies" },
      { name: "Plugin", value: "plugin" },
    ],
    result() {
      return this.focused.value;
    },
  },
  {
    type: "input",
    name: "pathToStrapiApp",
    message: "Enter the path to your Strapi application",
    initial: "./",
  },
];

// Plugin migration prompt's configuration
const pluginMigrationPrompt = () => {
  return [
    {
      type: "input",
      name: "name",
      message: "Provide the name of the plugin you want to migrate",
    },
  ];
};

// `codemods migrate`
const migrate = async () => {
  try {
    const options = await prompt(promptOptions);

    switch (options.type) {
      case "project":
        await migrateApiFolder(options.pathToStrapiApp);
        await migrateDependencies(options.pathToStrapiApp);
        break;
      case "dependencies":
        await migrateDependencies(options.pathToStrapiApp);
        break;
      case "plugin":
        // start plugin prompt
        const pluginOptions = await prompt(pluginMigrationPrompt(options));

        options.pathToV3Plugin = join(
          options.pathToStrapiApp,
          pluginOptions.name
        );

        // set path for plugin migration
        const plugin = {
          pathToV3: join(
            options.pathToStrapiApp,
            "plugins",
            pluginOptions.name
          ),
          pathForV4: join(
            options.pathToStrapiApp,
            "plugins",
            `${pluginOptions.name}-v4`
          ),
        };

        await migratePlugin(plugin.pathToV3, plugin.pathForV4);
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = migrate;
