jest.mock('fs-extra', () => ({
  pathExists: jest.fn(() => Promise.resolve()),
  readdir: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve()),
  copy: jest.fn(() => Promise.resolve()),
  move: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../update-plugin-folder-structure/utils', () => ({
  createDirectoryIndex: jest.fn(() => Promise.resolve()),
  createServerIndex: jest.fn(() => Promise.resolve()),
  createContentTypeIndex: jest.fn(() => Promise.resolve()),
  moveToServer: jest.fn(() => Promise.resolve()),
  moveBootstrapFunction: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../convert-models-to-content-types', () => jest.fn());
jest.mock('../../../utils/run-jscodeshift', () => jest.fn());

const { join, resolve } = require('path');
const fs = require('fs-extra');

const updatePluginFolderStructure = require('../../update-plugin-folder-structure');
const convertModelsToContentTypes = require('../../convert-models-to-content-types');
const utils = require('../../update-plugin-folder-structure/utils');
const runJscodeshift = require('../../../utils/run-jscodeshift');

describe('update plugin folder structure', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks if the path for v4 plugin already exists', async () => {
    fs.pathExists.mockReturnValueOnce(false);
    const dirPath = resolve('./test-dir');

    await updatePluginFolderStructure(dirPath);

    expect(fs.pathExists).toHaveBeenCalledWith(`${dirPath}-v4`);
  });

  it('exits when the v4 plugin path already exists', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const dirPath = resolve('./test-dir');

    await updatePluginFolderStructure(dirPath);

    expect(fs.pathExists).toHaveBeenCalledWith(`${dirPath}-v4`);
    expect(fs.readdir).not.toHaveBeenCalled();
  });

  it('creates strapi-admin.js and strapi-server.js', async () => {
    fs.pathExists.mockReturnValueOnce(false);
    const dirPath = resolve('./test-dir');

    await updatePluginFolderStructure(dirPath);

    expect(fs.copy.mock.calls[1]).toEqual([
      join(__dirname, '..', '..', 'utils', 'strapi-admin.js'),
      join(`${dirPath}-v4`, 'strapi-admin.js'),
    ]);
    expect(fs.copy.mock.calls[2]).toEqual([
      join(__dirname, '..', '..', 'utils', 'strapi-server.js'),
      join(`${dirPath}-v4`, 'strapi-server.js'),
    ]);
  });

  it.each(['controllers', 'models', 'middlewares', 'services', 'policies', 'routes', 'bootstrap'])(
    'moves %s to server directory',
    async (directory) => {
      fs.pathExists.mockReturnValueOnce(false).mockReturnValue(true);
      const dirPath = resolve('./test-dir');
      
      await updatePluginFolderStructure(dirPath);

      switch (directory) {
        case 'routes': {
          expect(utils.moveToServer).toHaveBeenCalledWith(`${dirPath}-v4`, '.', directory);
          break;
        }
        case 'policies': {
          expect(utils.moveToServer).toHaveBeenCalledWith(`${dirPath}-v4`, 'config', directory);
          break;
        }
        case 'bootstrap': {
          expect(utils.moveBootstrapFunction).toHaveBeenCalledWith(`${dirPath}-v4`);
          break;
        }
        case 'services': {
          expect(utils.moveToServer).toHaveBeenCalledWith(join(`${dirPath}-v4`), '.', directory);
          expect(runJscodeshift).toHaveBeenCalledWith(
            join(`${dirPath}-v4`, 'server', 'services'),
            'convert-object-export-to-function'
          );
          break;
        }
        case 'models': {
          expect(utils.moveToServer).toHaveBeenCalledWith(join(`${dirPath}-v4`), '.', directory);
          expect(convertModelsToContentTypes).toHaveBeenCalledWith(join(`${dirPath}-v4`, 'server'));
          break;
        }
        default: {
          expect(utils.moveToServer).toHaveBeenCalledWith(join(`${dirPath}-v4`), '.', directory);
        }
      }
    }
  );
});
