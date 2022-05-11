
const pluralize = require('pluralize');
const _ = require('lodash');

module.exports =  (relation, target, mapped, inversed) => ({
		type: "relation",  
		relation,
		target: `api::${_.kebabCase(pluralize.singular(target))}.${_.kebabCase(pluralize.singular(target))}`,
		inversedBy: !mapped ? undefined : inversed ? mapped : undefined, 
    mappedBy: !mapped ? undefined : inversed ? undefined : mapped
	})
