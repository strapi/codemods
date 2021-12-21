jest.mock('fs-extra', () => ({
  copy: jest.fn(() => Promise.resolve()),
  readdir: jest.fn(() => Promise.resolve()),
}));

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

describe('createDirectoryIndex', () => {
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