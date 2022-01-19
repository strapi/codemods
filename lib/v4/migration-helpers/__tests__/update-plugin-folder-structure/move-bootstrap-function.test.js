jest.mock('fs-extra', () => {
  return require('../../__mocks__/mock-fs')
});

jest.mock('../../update-plugin-folder-structure/utils/move-to-server', () => jest.fn());

const { join } = require('path');
const fs = require('fs-extra');

const { moveBootstrapFunction } = require('../../update-plugin-folder-structure/utils');
const moveToServer = require('../../update-plugin-folder-structure/utils/move-to-server');

describe('moveBootstrapFunction', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.readdir.mockReturnValueOnce([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('moves the bootstrap function to the v4 server root', async () => {
    const v4Plugin = './plugin-dir';

    await moveBootstrapFunction(v4Plugin);

    expect(moveToServer).toHaveBeenCalled();
  });

  it('removes the v3 bootstrap functions directory', async () => {
    const v4Plugin = './plugin-dir';

    await moveBootstrapFunction(v4Plugin);

    expect(fs.remove).toHaveBeenCalledWith(join(v4Plugin, 'config', 'functions'));
  });
});
