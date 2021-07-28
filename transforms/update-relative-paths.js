module.exports = function (file, api, options = {}) {
  const { from, to } = options
  const j = api
  const root = j(file.source)
  const requireServer = root.find(j.MemberExpression, {
    object: {
      callee: {
        name: "require",
      },
    },
  })

  requireServer.forEach(({ node }) => {
    console.log(node)
    node.object.arguments.filter((arg) => {
      if (arg.value.includes("./src/server")) {
        arg.value = relative(from, to)
      }
    })
  })

  return root.toSource()
}
