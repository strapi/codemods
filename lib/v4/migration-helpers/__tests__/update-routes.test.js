const { resolve, join } = require('path');
const { inspect } = require('util');
const fs = require('fs-extra');

const updateRoutes = require('../update-routes');
const mockRoutesV3 = require('../__mocks__/mock-routes-v3');
const mockRoutesV4 = require('../__mocks__/mock-routes-v4');

describe('migrate routes to v4', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    fs.readJSON.mockReturnValueOnce(mockRoutesV3);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a v4 routes file', async () => {
    const dirPath = resolve('./test-dir');
    const v4RoutesPath = join('routes', 'index.js');

    await updateRoutes(dirPath, 'index');

    const expectedPath = join(dirPath, v4RoutesPath);
    expect(fs.ensureFile).toHaveBeenCalledWith(expectedPath);
  });

  it('creates a write stream on the v4 routes file', async () => {
    const dirPath = resolve('./test-dir');
    const v4RoutesPath = join('routes', 'index.js');

    await updateRoutes(dirPath, 'index');

    const expectedPath = join(dirPath, v4RoutesPath);
    expect(fs.createWriteStream).toHaveBeenCalledWith(expectedPath);
  });

  it('gets the v3 routes', async () => {
    const dirPath = resolve('./test-dir');

    await updateRoutes(dirPath, 'index');

    const expectedV3RoutePath = join(dirPath, 'config', 'routes.json');
    expect(fs.readJSON).toHaveBeenCalledWith(expectedV3RoutePath);
  });

  it('writes valid v4 routes', async () => {
    const dirPath = resolve('./test-dir');

    const writeMock = jest.fn();
    fs.createWriteStream.mockReturnValueOnce({
      write: writeMock,
    });

    await updateRoutes(dirPath, 'index');
    
    expect(writeMock).toHaveBeenCalledWith(
      `module.exports = ${inspect(mockRoutesV4, { depth: Infinity })}`
    );
  });
});
