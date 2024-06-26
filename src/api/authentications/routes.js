const routes = (handler) => [
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler,
  },
  {
    method: 'PUT',
    path: '/authentications',
    handler: handler.putAuthenticationHandler,
  },
  {
    method: 'DELETE',
    path: '/authentications',
    handler: handler.deleteAuthenticationHandler,
  },
  {
    method: 'POST',
    path: '/authentications/verifications',
    handler: handler.postVerificationCodeHandler,
  },
  {
    method: 'POST',
    path: '/authentications/forgotpassword',
    handler: handler.postResetPasswordRequest,
  },
];

module.exports = routes;
