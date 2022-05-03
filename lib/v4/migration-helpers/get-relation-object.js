
const pluralize = require('pluralize');


module.exports =  (relation, target, mapped, inversed) => ({
		type: "relation",  
		relation: relation,
		target: `api::${pluralize.singular(target)}.${pluralize.singular(target)}`,
		inversedBy: !mapped ? undefined : inversed ? mapped : undefined, 
    mappedBy: !mapped ? undefined : inversed ? undefined : mapped
	})
