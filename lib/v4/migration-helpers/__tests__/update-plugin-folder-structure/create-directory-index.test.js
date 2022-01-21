jest.mock('../../update-plugin-folder-structure/transforms', () => ({
  importFilesToIndex: jest.fn(),
  addModulesToExport: jest.fn(),
}));

const { join } = require('path');
const fs = require('fs-extra');

const { createDirectoryIndex } = require('../../update-plugin-folder-structure/utils');
const {
  importFilesToIndex,
  addModulesToExport,
} = require('../../update-plugin-folder-structure/transforms');

describe('create-directory-index', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce([
      { name: 'test.js', isFile: jest.fn(() => true) },
      { name: 'test-two.js', isFile: jest.fn(() => true) },
      { name: 'index.js', isFile: jest.fn(() => true) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks if the directory exists', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4/server/some-api';

    await createDirectoryIndex(v4PluginPath);

    expect(fs.pathExists).toHaveBeenCalledWith(v4PluginPath);
  });

  it('exits when the directory does not exists', async () => {
    fs.pathExists.mockReturnValueOnce(false);
    const v4PluginPath = 'test-plugin-v4/server/some-api';

    await createDirectoryIndex(v4PluginPath);

    expect(fs.pathExists).toHaveBeenCalledWith(v4PluginPath);
    expect(fs.copy).not.toHaveBeenCalled();
  });

  it('creates an index file with exported modules', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4';

    await createDirectoryIndex(v4PluginPath);

    
    expect(fs.copy.mock.calls[0]).toEqual([
      join(__dirname, '..', '..', '..', 'utils', 'module-exports.js'),
      join(v4PluginPath, 'index.js'),
    ]);
    expect(importFilesToIndex).toHaveBeenCalledWith(join(v4PluginPath, 'index.js'), [
      'test.js',
      'test-two.js',
    ]);
    expect(addModulesToExport).toHaveBeenCalledWith(join(v4PluginPath, 'index.js'), [
      'test.js',
      'test-two.js',
    ]);
  });
});
