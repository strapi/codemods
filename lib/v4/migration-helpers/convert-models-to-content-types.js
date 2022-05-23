/**
 * Migrate API folder structure to v4
 */

const { join } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const pluralize = require('pluralize');

const { isPlural, isSingular } = pluralize;
const logger = require('../../global/utils/logger');
const getRelationObject = require('./get-relation-object');

/**
 * @description Migrates settings.json to schema.json
 *
 * @param {string} apiPath Path to the current api
 * @param {string} contentTypeName Name of the current contentType
 */
const convertModelToContentType = async (apiPath, contentTypeName) => {
  const settingsJsonPath = join(apiPath, 'models', `${contentTypeName}.settings.json`);

  const settingsExists = await fs.exists(settingsJsonPath);
  if (!settingsExists) {
    logger.error(`${contentTypeName}.settings.json does not exist`);
    return;
  }

  const v4SchemaJsonPath = join(apiPath, 'content-types', contentTypeName, 'schema.json');

  try {
    // Read the settings.json file
    const settingsJson = await fs.readJSON(settingsJsonPath);
    // Create a copy
    const schemaJson = { ...settingsJson };
    const infoUpdate = {
      singularName: _.kebabCase(pluralize.singular(contentTypeName)),
      pluralName: _.kebabCase(pluralize(contentTypeName)),
      displayName: _.upperFirst(contentTypeName),
      name: contentTypeName,
    };

    // Modify the JSON
    _.set(schemaJson, 'info', infoUpdate);

    if (schemaJson.attributes) {
      // Get relationships
      const relations = Object.entries(schemaJson.attributes).filter(
        ([, value]) => value.via || value.collection || value.model
      );

      const fixedRelations = relations.map(([key, value]) => {
        if (value.plugin === 'upload' && (value.model === 'file' || value.collection === 'file')) {
          // Media Plugin
          value = {
            type: 'media',
            allowedTypes: value.allowedTypes,
            multiple: value.collection,
            required: value.required,
            private: value.private,
          };
        } else if (value.plugin) {
          // Catch other plugins
          value = {
            type: 'relation',
            relation: value.collection ? 'oneToMany' : 'oneToOne',
            target: `plugin::${value.plugin}.${value.collection ? value.collection : value.model}`,
          };
        } else if (value.via && value.collection && isSingular(value.via)) {
          // One-To-Many
          value = getRelationObject('oneToMany', value.collection, value.via, false);
        } else if (value.via && value.model && isSingular(value.via)) {
          // One-To-One
          value = getRelationObject('oneToOne', value.model, value.via, true);
        } else if (value.model && !value.via && !value.collection) {
          // One-To-One (One-Way)
          value = getRelationObject('oneToOne', value.model, false);
        } else if (value.via && value.model && isPlural(value.via)) {
          // Many-To-One
          value = getRelationObject('manyToOne', value.model, value.via, true);
        } else if (value.via && value.collection && isPlural(value.via)) {
          // Many-To-Many
          value = getRelationObject('manyToMany', value.collection, value.via, value.dominant);
        } else if (value.collection && !value.via && !value.model) {
          // Many-Way
          value = getRelationObject('oneToMany', value.collection, false);
        } else {
          logger.warn(`unknown relation type, please fix manually: ${key}`);
        }

        return [key, value];
      });

      fixedRelations.forEach(([key, value]) => {
        _.set(schemaJson, `attributes.${key}`, value);
      });
    }

    // Create the new content-types/api/schema.json file
    await fs.ensureFile(v4SchemaJsonPath);
    // Write modified JSON to schema.json
    await fs.writeJSON(v4SchemaJsonPath, schemaJson, {
      spaces: 2,
    });
  } catch (error) {
    logger.error(
      `an error occured when migrating the model at ${settingsJsonPath} to a contentType at ${v4SchemaJsonPath} `
    );
  }

  const lifecyclePath = join(apiPath, 'models', `${contentTypeName}.js`);
  const lifecyclesExist = await fs.exists(lifecyclePath);

  const v4LifecyclesPath = join(apiPath, 'content-types', contentTypeName, 'lifecycle.js');

  if (lifecyclesExist) {
    try {
      await fs.move(lifecyclePath, v4LifecyclesPath);
    } catch (error) {
      logger.error(`failed to migrate lifecycles from ${lifecyclePath} to ${v4LifecyclesPath}`);
    }
  } else {
    logger.info(`will not create lifecycles since ${contentTypeName}.js was not found`);
  }
};

/**
 *
 * @param {string} apiPath Path to the current API
 */
const updateContentTypes = async (apiPath) => {
  const exists = await fs.exists(join(apiPath, 'models'));

  if (!exists) return;

  const allModels = await fs.readdir(join(apiPath, 'models'), {
    withFileTypes: true,
  });

  const allModelFiles = allModels.filter((f) => f.isFile() && f.name.includes('settings'));

  if (!allModelFiles.length) {
    await fs.remove(join(apiPath, 'models'));
  }

  for (const model of allModelFiles) {
    const [contentTypeName] = model.name.split('.');
    await convertModelToContentType(apiPath, contentTypeName);
  }

  // all models have been deleted, remove the directory
  await fs.remove(join(apiPath, 'models'));
};

module.exports = updateContentTypes;
