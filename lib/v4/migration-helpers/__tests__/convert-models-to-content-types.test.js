jest.mock('fs-extra', () => {
  return require('../__mocks__/mock-fs.js');
});

const { join } = require('path');
const fs = require('fs-extra');

const convertModelsToContentTypes = require('../convert-models-to-content-types');

describe('convert models to content types', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce([
      { name: 'test.settings.json', isFile: jest.fn(() => true) },
      { name: 'test.js', isFile: jest.fn(() => true) },
      { name: 'test', isFile: jest.fn(() => false) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks for a path to v3 models', async () => {
    fs.exists.mockReturnValueOnce(true);
    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    expect(fs.exists).toHaveBeenCalledWith(join(dirPath, 'models'));
  });

  it('exits when path is not v3 models', async () => {
    fs.exists.mockReturnValueOnce(false);
    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    expect(fs.exists).toHaveBeenCalled();
    expect(fs.readdir).not.toHaveBeenCalled();
  });

  it('gets the v3 models', async () => {
    fs.exists.mockReturnValueOnce(true);
    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    expect(fs.readdir).toHaveBeenCalledWith(join(dirPath, 'models'), {
      withFileTypes: true,
    });
  });

  it('gets the v3 settings.json', async () => {
    fs.exists.mockReturnValueOnce(true).mockReturnValueOnce(true);

    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    const expectedPath = join(dirPath, 'models', 'test.settings.json');
    expect(fs.readJSON).toHaveBeenCalledWith(expectedPath);
  });

  it('creates the v4 shcema.json', async () => {
    fs.exists.mockReturnValueOnce(true).mockReturnValueOnce(true);

    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    const expectedPath = join(dirPath, 'content-types', 'test', 'schema.json');
    expect(fs.ensureFile).toHaveBeenCalledWith(expectedPath);
  });

  it('writes the json with correct info object', async () => {
    fs.exists.mockReturnValueOnce(true).mockReturnValueOnce(true);

    const dirPath = './test-dir';

    await convertModelsToContentTypes(dirPath);

    const expectedPath = join(dirPath, 'content-types', 'test', 'schema.json');
    const expectedInfoObject = {
      singularName: 'test',
      pluralName: 'tests',
      displayName: 'Test',
      name: 'test',
    };
    expect(fs.writeJSON).toHaveBeenCalledWith(
      expectedPath,
      { info: expectedInfoObject },
      {
        spaces: 2,
      }
    );
  });
});
