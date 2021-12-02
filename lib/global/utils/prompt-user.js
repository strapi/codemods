// Inquirer engine.
const { prompt } = require("inquirer");

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

module.exports = async (options) => {
  const promptOptions = options || defaultPromptOptions;
  return prompt(promptOptions);
};
