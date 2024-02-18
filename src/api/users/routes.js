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
  {
    method: 'PUT',
    path: '/users/resetpassword',
    handler: handler.resetUserPasswordHandler,
  },
];

module.exports = routes;
