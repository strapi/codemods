jest.mock('../../update-plugin-folder-structure/transforms', () => ({
  importFilesToIndex: jest.fn(),
  addModulesToExport: jest.fn(),
}));

const { join } = require('path');
const fs = require('fs-extra');

const { createServerIndex } = require('../../update-plugin-folder-structure/utils');
const {
  importFilesToIndex,
  addModulesToExport,
} = require('../../update-plugin-folder-structure/transforms');

describe('create-server-index', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce(['test.js', 'test-two.js', 'index.js']);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an index file for the server directory', async () => {
    const v4PluginPath = 'test-plugin-v4/server';

    await createServerIndex(v4PluginPath);

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
