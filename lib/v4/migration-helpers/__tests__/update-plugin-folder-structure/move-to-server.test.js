const { join } = require('path');
const fs = require('fs-extra');

const { moveToServer } = require('../../update-plugin-folder-structure/utils');

describe('moveToServer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks if the origin directory exists', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4';

    await moveToServer(v4PluginPath, 'origin', 'destination');

    expect(fs.pathExists).toHaveBeenCalledWith(join(v4PluginPath, 'origin', 'destination'));
  });

  it('exits when the origin directory does not exists', async () => {
    fs.pathExists.mockReturnValueOnce(false);
    const v4PluginPath = 'test-plugin-v4';

    await moveToServer(v4PluginPath, 'origin', 'destination');

    expect(fs.pathExists).toHaveBeenCalledWith(join(v4PluginPath, 'origin', 'destination'));
    expect(fs.move).not.toHaveBeenCalled();
  });

  it('moves to the correct v4 server path', async () => {
    fs.pathExists.mockReturnValueOnce(true);
    const v4PluginPath = 'test-plugin-v4';

    await moveToServer(v4PluginPath, 'origin', 'destination');

    expect(fs.move).toHaveBeenCalledWith(
      join(v4PluginPath, 'origin', 'destination'),
      join(v4PluginPath, 'server', 'destination')
    );
  });
});
