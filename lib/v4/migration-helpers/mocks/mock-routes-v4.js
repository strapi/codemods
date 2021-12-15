module.exports = [
  {
    method: 'GET',
    path: '/test/',
    handler: 'test.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/test/create',
    handler: 'test.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/test/:id',
    handler: 'test.update',
    config: {
      policies: [],
    },
  },
];
