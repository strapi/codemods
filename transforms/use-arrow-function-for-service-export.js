module.exports = function useArrowFunctionForService(file, api) {
  // Don't run on the directory's index
  if (file.path.includes('index')) return
  const j = api.jscodeshift;
  const root = j(file.source);

  const moduleExports = root.find(j.AssignmentExpression, {
    left: {
      object: {
        name: "module",
      },
      property: {
        name: "exports",
      },
    },
  });

  const objectExpression = moduleExports.get().value.right;
  const arrowFunctionExpression = j.arrowFunctionExpression(
    [],
    objectExpression
  );

  const property = j.property(
    "init",
    j.identifier("strapi"),
    j.identifier("strapi")
  );

  moduleExports.get().value.right = arrowFunctionExpression;

  return root.toSource();
};
