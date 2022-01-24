const fs = require('fs-extra');
const j = require('jscodeshift');
const { camelCase } = require('lodash');

const { statement } = j.template;
/**
 *
 * @param {string} filePath
 * @param {array} imports
 */
async function importFilesToIndex(filePath, imports) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const body = root.find(j.Program).get('body');

  imports.forEach((fileImport) => {
    // Remove extension
    const filename = fileImport.replace(/\.[^/.]+$/, '');

    const declaration = statement`const ${camelCase(filename)} = require(${j.literal(
      './' + filename
    )});\n`;

    const hasUseStrict = body.get(0).value.directive === 'use strict';
    if (hasUseStrict) {
      // When use strict is present add imports after
      body.get(0).insertAfter(declaration);
    } else {
      // Otherwise add them to the top of the file
      body.unshift(declaration);
    }
  });

  await fs.writeFile(filePath, root.toSource({ quote: 'single' }));
}

async function addModulesToExport(filePath, modules) {
  const fileContent = await fs.readFile(filePath);
  const file = fileContent.toString();
  const root = j(file);
  const moduleExports = root.find(j.AssignmentExpression, {
    left: {
      object: {
        name: 'module',
      },
      property: {
        name: 'exports',
      },
    },
  });

  modules.forEach((mod) => {
    // Remove extension
    const moduleName = mod.replace(/\.[^/.]+$/, '');
    const property = j.property(
      'init',
      j.identifier(camelCase(moduleName)),
      j.identifier(camelCase(moduleName))
    );

    moduleExports.get().value.right.properties.push({ ...property, shorthand: true });
  });

  await fs.writeFile(filePath, root.toSource({ quote: 'single' }));
}

module.exports = { importFilesToIndex, addModulesToExport };
