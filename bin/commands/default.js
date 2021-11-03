// Enquirer engine.
const { prompt } = require("enquirer");

// Commands
const migrate = require("./migrate");
const transform = require("./transform");

// Prompt's configuration
const promptOptions = [
  {
    type: "select",
    name: "type",
    message: "What would you like to do?",
    choices: [
      { name: "Migrate", value: "migrate" },
      { name: "Transform", value: "transform" },
    ],
    result() {
      return this.focused.value;
    },
  },
];

const defaultCommand = async () => {
  try {
    const options = await prompt(promptOptions);

    switch (options.type) {
      case "migrate":
        await migrate();
        break;
      case "transform":
        await transform();
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = defaultCommand;
