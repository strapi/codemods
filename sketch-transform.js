// Update plugin getters
// strapi.plugins['plugin-name'] => strapi.plugin("plugin-name")
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

  // Builds a new node and replaces the old one in the AST
  pluginGetter.replaceWith(() => {
    return j.callExpression(
      j.memberExpression(j.identifier("strapi"), j.identifier("plugin")),
      [j.literal("plugin-name")]
    );
  });

  return root.toSource();
}

export function updateServerImport(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const requireServer = root.find(j.MemberExpression, {
    object: {
      callee: {
        name: "require",
      },
    },
  });

  requireServer.forEach(({ node }) => {
    console.log(node);
    node.object.arguments.filter((arg) => {
      if (arg.value.includes("./src/server")) {
        arg.value = "some-new-value";
      }
    });
  });

  return root.toSource();
}

module.exports = function (file, api) {
  const { from, to } = options;
  const j = api;
  const root = j(file.source);
  const requireServer = root.find(j.MemberExpression, {
    object: {
      callee: {
        name: "require",
      },
    },
  });

  requireServer.forEach(({ node }) => {
    console.log(node);
    node.object.arguments.filter((arg) => {
      if (arg.value.includes("./src/server")) {
        arg.value = relative(from, to);
      }
    });
  });

  return root.toSource();
};
