
const pluralize = require('pluralize');


module.exports =  (relation, target, hasMapped, inversed) => {
	value = {
		type: "relation",  
		relation: "oneToMany",
		target: `api::${pluralize.singular(target)}.${pluralize.singular(target)}`,
		inversedBy: !hasMapped ? undefined : inversed ? value.via : undefined, 
    mappedBy: !hasMapped ? undefined : inversed ? undefined : value.via
	}
}