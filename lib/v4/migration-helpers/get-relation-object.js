const _ = require('lodash');
const pluralize = require('pluralize');

const getMapped = (mapped, inversed) => {
  if (!mapped) return {};

  if (inversed) {
    return {
      inversedBy: mapped,
    };
  }

  return {
    mappedBy: mapped,
  };
};

/**
 * 
 * @param {string} relation The type of relation
 * @param {object} attribute The attribute object
 * @returns 
 */
module.exports = (relation, attribute) => {
  // Parse the target
  const targetType = attribute.collection || attribute.model;
  const target = attribute.plugin
    ? `plugin::${attribute.plugin}.${targetType}`
    : `api::${_.kebabCase(pluralize.singular(targetType))}.${_.kebabCase(
        pluralize.singular(targetType)
      )}`;

  return {
    type: 'relation',
    relation,
    target,
    ...getMapped(attribute.via, attribute.inversed),
  };
};
