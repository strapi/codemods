jest.mock('fs-extra', () => {
  return require('../../__mocks__/mock-fs')
});

jest.mock('../../update-plugin-folder-structure/transforms', () => ({
  importFilesToIndex: jest.fn(),
  addModulesToExport: jest.fn(),
}));

jest.mock('../../update-plugin-folder-structure/utils/create-directory-index', () => jest.fn());

const { join } = require('path');
const fs = require('fs-extra');

const { createContentTypeIndex } = require('../../update-plugin-folder-structure/utils');
const createDirectoryIndex = require('../../update-plugin-folder-structure/utils/create-directory-index');

const {
  importFilesToIndex,
  addModulesToExport,
} = require('../../update-plugin-folder-structure/transforms');

describe('createDirectoryIndex', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce([
      { name: 'test', isDirectory: jest.fn(() => true) },
      { name: 'test-two', isDirectory: jest.fn(() => true) },
      { name: 'index.js', isDirectory: jest.fn(() => false) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks if the directory exists', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4';

    await createContentTypeIndex(v4PluginPath, 'test-dir');

    expect(fs.pathExists).toHaveBeenCalledWith('test-dir');
  });

  it('exits when the directory does not exists', async () => {
    fs.pathExists.mockReturnValueOnce(false);
    const v4PluginPath = 'test-plugin-v4';

    await createContentTypeIndex(v4PluginPath, 'test-dir');

    expect(fs.pathExists).toHaveBeenCalledWith('test-dir');
    expect(fs.copy).not.toHaveBeenCalled();
  });

  it('creates an index file for each content type directory', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4';

    await createContentTypeIndex(v4PluginPath, 'test-dir');

    expect(createDirectoryIndex.mock.calls).toEqual([
      [join(v4PluginPath, 'server', 'content-types', 'test')],
      [join(v4PluginPath, 'server', 'content-types', 'test-two')],
    ]);
    expect(importFilesToIndex).toHaveBeenCalledWith(join('test-dir', 'index.js'), ['test', 'test-two'])
    expect(addModulesToExport).toHaveBeenCalledWith(join('test-dir', 'index.js'), ['test', 'test-two'])
  });
});
