module.exports = {
  exists: jest.fn(() => Promise.resolve()),
  pathExists: jest.fn(() => Promise.resolve()),
  readdir: jest.fn(() => Promise.resolve()),
  readJSON: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  ensureFile: jest.fn(() => Promise.resolve()),
  writeJSON: jest.fn(() => Promise.resolve()),
  copy: jest.fn(() => Promise.resolve()),
  move: jest.fn(() => Promise.resolve())
}



