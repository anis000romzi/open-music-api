const routes = (handler) => [
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
  },
  {
    method: 'POST',
    path: '/users/verify',
    handler: handler.verifyUserHandler,
  },
];

module.exports = routes;
