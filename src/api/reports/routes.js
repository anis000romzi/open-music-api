const routes = (handler) => [
  {
    method: 'POST',
    path: '/reports',
    handler: handler.postReportHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
];

module.exports = routes;
