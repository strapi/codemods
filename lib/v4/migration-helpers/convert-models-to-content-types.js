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

    if (
        schemaJson.collectionName === 'users-permissions_user' ||
        schemaJson.collectionName === 'users-permissions_permission' ||
        schemaJson.collectionName === 'users-permissions_role'
    ) {
      let newPrefix = schemaJson.collectionName.replace('users-permissions_', 'up_');
      schemaJson.collectionName = pluralize(newPrefix);
    }

    // Modify the JSON
    _.set(schemaJson, 'info', infoUpdate);

    if (schemaJson.attributes) {
      Object.entries(schemaJson.attributes).forEach(([key, attribute]) => {
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

        _.set(schemaJson, `attributes.${key}`, attribute);
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

  const v4LifecyclesPath = join(apiPath, 'content-types', contentTypeName, 'lifecycles.js');

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
