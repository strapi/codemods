jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve()),
}));

jest.mock('fs-extra', () => ({
  writeJSON: jest.fn(() => Promise.resolve()),
}));

const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

const updatePackageDependencies = require('../update-package-dependencies');

const packageJsonPath = path.resolve(
  path.join(__dirname, '..', 'mocks', 'mock-package-json-v3.json')
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
    const v4PackageJSON = {
      dependencies: {
        '@strapi/strapi': '4.0.0',
        '@strapi/admin': '4.0.0',
        '@strapi/utils': '4.0.0',
        '@strapi/plugin-content-type-builder': '4.0.0',
        '@strapi/plugin-content-manager': '4.0.0',
        '@strapi/plugin-users-permissions': '4.0.0',
        '@strapi/plugin-email': '4.0.0',
        '@strapi/plugin-upload': '4.0.0',
        '@strapi/plugin-i18n': '4.0.0',
      },
    };

    const testDir = 'test-dir';

    await updatePackageDependencies(testDir);

    expect(fs.writeJSON).toHaveBeenCalledWith(packageJsonPath, v4PackageJSON, { spaces: 2 });
  });
});
