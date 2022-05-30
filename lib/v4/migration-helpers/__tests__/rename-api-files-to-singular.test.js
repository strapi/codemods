const fs = require('fs-extra');

const renameApiFilesToSingular = require('../rename-api-files-to-singular');

describe('Rename collections types to singular name', () => {
  it('renames plural paths to singular paths', async () => {
    await renameApiFilesToSingular('test', 'plurals', 'plural');
    expect(fs.rename.mock.calls).toEqual([
      ['test/plurals', 'test/plural'],
      ['test/plural/controllers/plurals.js', 'test/plural/controllers/plural.js'],
      ['test/plural/services/plurals.js', 'test/plural/services/plural.js'],
      ['test/plural/models/plurals.js', 'test/plural/models/plural.js'],
      ['test/plural/models/plurals.settings.json', 'test/plural/models/plural.settings.json'],
    ]);
  });
});
