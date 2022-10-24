/**
 * Migrate components to v4 structure
 */
const fs = require('fs-extra');
const _ = require('lodash');
const pluralize = require('pluralize');

const { isPlural, isSingular } = pluralize;
const logger = require('../../global/utils/logger');
const getRelationObject = require('./get-relation-object');

/**
 * @description Migrates component json to v4 structure with nested relations
 *
 * @param {string} componentsPath Path to the components folder
 * @param {string} componentName Name of the current component
 */
const convertComponent = async (componentsPath, componentCategory, componentName) => {
  const componentExists = await fs.exists(componentsPath);
  if (!componentExists) {
    logger.error(`${componentCategory}/${componentName}.json does not exist`);
    return;
  }

  try {
    // Read the component.json file
    const componentJson = await fs.readJSON(componentsPath);
    if (componentJson.info.name) {
      componentJson.info.displayName = componentJson.info.name;
      delete componentJson.info.name;
    }

    if (componentJson.attributes) {
      Object.entries(componentJson.attributes).forEach(([key, attribute]) => {
        // Not a relation, return early
        if (!attribute.via && !attribute.collection && !attribute.model) return;

        if (
          attribute.plugin === 'upload' &&
          (attribute.model === 'file' || attribute.collection === 'file')
        ) {
          // Handle the Media Plugin
          attribute = {
            type: 'media',
            allowedTypes: attribute.allowedTypes,
            multiple: _.has(attribute, 'collection'),
            required: attribute.required,
            private: attribute.private,
          };
        } else if (
          attribute.plugin === 'admin' &&
          (attribute.model === 'user' || attribute.collection === 'user')
        ) {
          // Handle admin user relation
          attribute = {
            type: 'relation',
            target: 'admin::user',
            relation: _.has(attribute, 'collection') ? 'oneToMany' : 'oneToOne',
          };

          if (attribute.private) {
            attribute.private = true;
          }
        } else if (attribute.via && attribute.model && isSingular(attribute.via)) {
          // One-To-One
          attribute = getRelationObject('oneToOne', { ...attribute, inversed: true });
        } else if (attribute.model && !attribute.via && !attribute.collection) {
          // One-To-One (One-Way)
          attribute = getRelationObject('oneToOne', { ...attribute, inversed: false });
        } else if (attribute.via && attribute.model && isPlural(attribute.via)) {
          // Many-To-One
          attribute = getRelationObject('manyToOne', { ...attribute, inversed: true });
        } else if (attribute.via && attribute.collection && isPlural(attribute.via)) {
          // Many-To-Many
          attribute = getRelationObject('manyToMany', {
            ...attribute,
            inversed: attribute.dominant,
          });
        } else if (attribute.collection && !attribute.via && !attribute.model) {
          // Many-Way
          attribute = getRelationObject('oneToMany', attribute);
        } else if (attribute.via && attribute.collection) {
          // One-To-Many
          attribute = getRelationObject('oneToMany', { ...attribute, inversed: false });
        } else {
          logger.warn(`unknown relation type, please fix manually: ${key}`);
        }

        _.set(componentJson, `attributes.${key}`, attribute);
      });
    }

    // Ensure the component.json file exists
    await fs.ensureFile(componentsPath);
    // Write modified JSON to component.sjon
    await fs.writeJSON(componentsPath, componentJson, {
      spaces: 2,
    });
  } catch (error) {
    logger.error(
      `an error occurred when trying to migrate ${componentCategory}/${componentName}.json`
    );
  }
};

module.exports = convertComponent;