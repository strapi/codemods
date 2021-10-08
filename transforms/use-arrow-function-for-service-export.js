module.exports = function useArrowFunctionForService(file, api) {
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
  moduleExports.get().value.right = arrowFunctionExpression;
  return root.toSource();
};
