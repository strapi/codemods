jest.mock('fs-extra', () => {
  return require('../__mocks__/mock-fs')
});

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
    fs.readdir.mockReturnValueOnce([
      { name: 'test', isDirectory: jest.fn(() => true) },
      { name: 'test-two', isDirectory: jest.fn(() => true) },
      { name: 'test.js', isDirectory: jest.fn(() => false) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('copies the v3 api to src directory', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api-copy');
    expect(fs.copy).toHaveBeenCalledWith(join(resolve(appPath), 'api'), expectedV4Path);
  });

  it('converts models to content types', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api-copy');
    expect(updateContentTypes.mock.calls).toEqual([
      [join(expectedV4Path, 'test')],
      [join(expectedV4Path, 'test-two')],
    ]);
  });

  it('updates routes', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api-copy');
    expect(updateRoutes.mock.calls).toEqual([
      [join(expectedV4Path, 'test'), 'test'],
      [join(expectedV4Path, 'test-two'), 'test-two'],
    ]);
  });

  it('updates policies', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api-copy');
    expect(updatePolicies.mock.calls).toEqual([
      [join(expectedV4Path, 'test')],
      [join(expectedV4Path, 'test-two')],
    ]);
  });

  it('updates services', async () => {
    const appPath = 'test-dir';

    await updateApiFolderStructure(appPath);

    const expectedV4Path = join(resolve(appPath), 'src', 'api-copy');
    expect(runJscodeshift.mock.calls).toEqual([
      [join(expectedV4Path, 'test', 'services'), 'convert-object-export-to-function'],
      [join(expectedV4Path, 'test-two', 'services'), 'convert-object-export-to-function'],
    ]);
  });
});
