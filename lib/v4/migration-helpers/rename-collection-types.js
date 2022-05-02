const fs = require('fs-extra')
const { join } = require('path');

module.exports = async (path, oldName, newName) => {
	const oldPath = join(path, oldName)
	const newPath = join(path, newName)
	await fs.rename(oldPath, newPath)
	await fs.rename(join(newPath, 'controllers', `${oldName}.js`), join(newPath, 'controllers', `${newName}.js`))
	const documentationDirs = await fs.readdir(join(newPath, 'documentation')) 
	for (dir of documentationDirs) {
		await fs.rename(join(newPath, 'documentation', '1.0.0', `${oldName}.json`), join(newPath, 'documentation', dir, `${newName}.json`))
	}
	await fs.rename(join(newPath, 'services', `${oldName}.js`), join(newPath, 'services', `${newName}.js`))
	await fs.rename(join(newPath, 'models', `${oldName}.js`), join(newPath, 'models', `${newName}.js`))
	await fs.rename(join(newPath, 'models', `${oldName}.settings.json`), join(newPath, 'models', `${newName}.settings.json`))
}