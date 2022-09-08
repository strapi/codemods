jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve()),
}));

const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

const updatePackageDependencies = require('../update-package-dependencies');

const packageJsonPath = path.resolve(
  path.join(__dirname, '..', '__mocks__', 'mock-package-json-v3.json')
);

describe('update api folder structure', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(path, 'resolve').mockReturnValueOnce(packageJsonPath);
    axios.get.mockReturnValueOnce({
      data: {
        'dist-tags': {
          next: '4.0.0-next.20',
          latest: '4.0.0',
          beta: '4.0.0-beta.22',
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('gets the latest strapi version', async () => {
    const testDir = 'test-dir';

    await updatePackageDependencies(testDir);

    expect(axios.get).toHaveBeenCalled();
  });

  it('writes the correct v4 dependencies', async () => {
    const testDir = 'test-dir';
    const v4PackageJSON = {
      dependencies: {
        '@strapi/strapi': '4.0.0',
        '@strapi/plugin-users-permissions': '4.0.0',
        '@strapi/plugin-i18n': '4.0.0',
      },
      engines: {
        node: '>=14.19.1 <=16.x.x',
        npm: '>=6.0.0',
      },
    };

    await updatePackageDependencies(testDir);

    expect(fs.writeJSON).toHaveBeenCalledWith(packageJsonPath, v4PackageJSON, { spaces: 2 });
  });
});
