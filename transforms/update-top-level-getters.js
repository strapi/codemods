// Update plugin getters
// strapi.plugins['plugin-name'] => strapi.plugin("plugin-name")
// TOOD: should be able to be used with models, controllers, services, etc...
export function updateTopLevelGetters(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const pluginGetter = root.find(j.MemberExpression, {
    object: {
      object: {
        name: "strapi",
      },
      property: {
        name: "plugins",
      },
    },
  });

  pluginGetter.replaceWith(() => {
    return j.callExpression(
      j.memberExpression(j.identifier("strapi"), j.identifier("plugin")),
      [j.literal("plugin-name")]
    );
  });

  return root.toSource();
}
