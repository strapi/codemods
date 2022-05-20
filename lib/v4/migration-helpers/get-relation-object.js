
const pluralize = require('pluralize');
const _ = require('lodash');

function getMapped(mapped, inversed) {
  if (!mapped) return {};

  if (inversed)
    return {
      inversedBy: mapped,
    };

  return {
    mappedBy: mapped,
  };
}

module.exports = (relation, target, mapped, inversed) => ({
  type: 'relation',
  relation,
  target: `api::${_.kebabCase(pluralize.singular(target))}.${_.kebabCase(
    pluralize.singular(target)
  )}`,
  ...getMapped(mapped, inversed),
});
