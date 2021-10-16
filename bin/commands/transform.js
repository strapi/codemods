// jscodeshift engine
const jscodeshift = require("jscodeshift/dist/Runner");

// Enquirer engine.
const { prompt } = require("enquirer");

// Transform files
const { changeFindToFindManyFile } = require("../../lib/transforms");

const promptOptions = [
  {
    type: "select",
    name: "type",
    message: "What kind of transformation do you want to perform?",
    choices: [{ name: "find -> findMany", value: "change-find-to-findMany" }],
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

const transform = async () => {
  const options = await prompt(promptOptions);

  switch (options.type) {
    case "change-find-to-findMany":
      await jscodeshift.run(changeFindToFindManyFile, [options.path], {});
      break;
  }
};

module.exports = transform;
