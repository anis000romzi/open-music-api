const routes = (handler) => [
  {
    method: 'POST',
    path: '/history',
    handler: handler.postHistoryHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/history',
    handler: handler.getHistoryHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
];

module.exports = routes;
