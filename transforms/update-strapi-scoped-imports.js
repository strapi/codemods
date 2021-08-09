export default function updateStrapiScopedImports(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const imports = root.find(j.CallExpression, {
    callee: {
      name: "require",
    },
  });

  imports.forEach(({ node }) => {
    const arg = node.arguments[0].value;
    const update = arg.replace("strapi-", "@strapi/");
    node.arguments[0].value = update;
  });

  return root.toSource();
}
