const { join } = require('path');
const fs = require('fs-extra');

const updateApiPolicies = require('../update-api-policies');

describe('update api policies', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce([
      { name: 'test.js', isFile: jest.fn(() => true) },
      { name: 'test-two.js', isFile: jest.fn(() => true) },
      { name: 'test', isFile: jest.fn(() => false) },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks for a path to v3 policies', async () => {
    fs.exists.mockReturnValueOnce(true);
    const dirPath = './test-dir';

    await updateApiPolicies(dirPath);

    const expectedPath = join(dirPath, 'config', 'policies');
    expect(fs.exists).toHaveBeenCalledWith(expectedPath);
  });

  it('exits when path is not v3 policies', async () => {
    fs.exists.mockReturnValueOnce(false);
    const dirPath = './test-dir';

    await updateApiPolicies(dirPath);

    const expectedPath = join(dirPath, 'config', 'policies');
    expect(fs.exists).toHaveBeenCalledWith(expectedPath);
    expect(fs.readdir).not.toHaveBeenCalled();
  });

  it('gets the v3 policies', async () => {
    fs.exists.mockReturnValueOnce(true);
    const dirPath = './test-dir';

    await updateApiPolicies(dirPath);

    const expectedPath = join(dirPath, 'config', 'policies');
    expect(fs.readdir).toHaveBeenCalledWith(expectedPath, {
      withFileTypes: true,
    });
  });

  it('copies the v3 policies to the correct v4 path', async () => {
    fs.exists.mockReturnValueOnce(true);
    const dirPath = './test-dir';

    await updateApiPolicies(dirPath);

    const expectedV3Path = join(dirPath, 'config', 'policies');
    const expectedV4Path = join(dirPath, 'policies');
    expect(fs.copy.mock.calls).toEqual([
      [join(expectedV3Path, 'test.js'), join(expectedV4Path, 'test.js')],
      [join(expectedV3Path, 'test-two.js'), join(expectedV4Path, 'test-two.js')],
    ]);
  });
});
