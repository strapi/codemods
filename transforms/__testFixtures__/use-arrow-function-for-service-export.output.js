function foo() {
  console.log("code");
}

function bar() {
  console.log("more code");
}

module.exports = () => ({
  foo,
  bar
});
