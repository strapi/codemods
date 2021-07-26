const fs = require("fs")
const { resolve } = require("path")

const CODE_MODS = [
  "./modify-me-1",
  "./modify-me-2",
  "./modify-me-3",
  // etc...
]

// Move files and folders from existing paths to new paths
// Should match:
// https://github.com/strapi/plugin-rfc-examples/tree/master/upload
function convertPlugin(pathToPlugin) {
  // Recursively traverse folders and map files to an array
  const files = walkPlugin(pathToPlugin)

  // Get only the js files
  const jsFilePaths = files.filter((file) => file.ext === "js")

  for (const path of jsFilePaths) {
    routeServerFiles(resolve(path))
    // Check if path requires a codemod
    if (CODE_MODS.includes(path)) {
      // run codemod for that path
    }
  }
}

/**
 * @returns {array} list of all files in the plugin
 */
function walkPlugin(pathToPlugin) {
  // do some really cool recursion
  // returns array of file names
}

// create src/server
// move controllers, config, hooks, middleware, models, and policies
// create index.js
function routeServerFiles(currentPath) {
  const parsedPathName = "some value"
  const parsedDirectory = "some value"
  fs.rename(currentPath, `./server/${parsedDirectory}/${parsedPathName}.js`)
}

function createBasePluginTemplate() {
  // https://github.com/strapi/plugin-rfc-examples/tree/master/upload
  
  // copy directory admin from existing plugin
    // add index.js file
  // copy direcotries controller, hooks, config, middleware, models, and policies
    // add index.js file
    
  // write file strapi-admin.js
    // require ./src/admin

  // write file write strapi-server.js
    // require ./src/server
}
