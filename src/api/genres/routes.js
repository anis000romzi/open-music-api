const routes = (handler) => [
  {
    method: 'GET',
    path: '/genres',
    handler: handler.getGenresHandler,
  },
];

module.exports = routes;
