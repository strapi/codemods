const prettier = require("prettier");

const { readFile, writeFile, readdir, lstat } = require("fs-extra");

const formatCode = async (path) => {
  const stat = await lstat(path);
  if (stat.isFile()) {
    const fileContent = await readFile(path, "utf-8");
    return await writeFile(
      path,
      prettier.format(fileContent, {
        filepath: path,
      })
    );
  }
  const directory = await readdir(path, { withFileTypes: true });
  const files = directory.filter((fd) => fd.isFile());

  try {
    for (const file of files) {
      const filePath = join(path, file.name);
      const fileContent = await readFile(filePath, "utf-8");
      await writeFile(
        path,
        prettier.format(fileContent, {
          filepath: filePath,
        })
      );
    }
  } catch (error) {
    console.error(`error: an error occured while formatting code ${path}`);
  }
};

module.exports = formatCode;
