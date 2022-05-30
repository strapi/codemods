jest.mock('../convert-models-to-content-types', () => jest.fn());
jest.mock('../update-routes', () => jest.fn());
jest.mock('../update-api-policies', () => jest.fn());
jest.mock('../../utils/run-jscodeshift', () => jest.fn());

const { join, resolve } = require('path');
const fs = require('fs-extra');

const updateApiFolderStructure = require('../update-api-folder-structure');
const updateContentTypes = require('../convert-models-to-content-types');
const updateRoutes = require('../update-routes');
const updatePolicies = require('../update-api-policies');
const runJscodeshift = require('../../utils/run-jscodeshift');

describe('update api folder structure', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock the first call to readdir
    fs.readdir.mockReturnValueOnce([
      { name: 'test', isDirectory: jest.fn(() => true) },
      { name: 'test-two', isDirectory: jest.fn(() => true) },
      { name: 'test.js', isDirectory: jest.fn(() => false) },
    ]);
    // Mock the second call to readdir
    fs.readdir.mockReturnValueOnce([
      { name: 'test', isDirectory: jest.fn(() => true) },
      { name: 'test-two', isDirectory: jest.fn(() => true) },
      { name: 'test.js', isDirectory: jest.fn(() => false) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('copies the v3 api to a v3 directory for safe keeping', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedv3CopyPath = join(resolve(appPath), 'v3', 'api');
    expect(fs.copy).toHaveBeenCalledWith(join(resolve(appPath), 'api'), expectedv3CopyPath);
  });

  it('moves the v3 api to v4 src directory', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api');

    expect(fs.move).toHaveBeenCalledWith(join(resolve(appPath), 'api'), expectedV4Path);
  });

  it('converts models to content types', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api');
    expect(updateContentTypes.mock.calls).toEqual([
      [join(expectedV4Path, 'test')],
      [join(expectedV4Path, 'test-two')],
    ]);
  });

  it('updates routes', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api');
    expect(updateRoutes.mock.calls).toEqual([
      [join(expectedV4Path, 'test'), 'test', 'test'],
      [join(expectedV4Path, 'test-two'), 'test-two', 'test-two'],
    ]);
  });

  it('updates policies', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api');
    expect(updatePolicies.mock.calls).toEqual([
      [join(expectedV4Path, 'test')],
      [join(expectedV4Path, 'test-two')],
    ]);
  });

  it('updates services', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api');
    expect(runJscodeshift.mock.calls).toEqual([
      [join(expectedV4Path, 'test', 'services'), 'convert-object-export-to-function'],
      [join(expectedV4Path, 'test-two', 'services'), 'convert-object-export-to-function'],
    ]);
  });
});
