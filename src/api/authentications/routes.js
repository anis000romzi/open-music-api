const Joi = require('joi');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler,
    options: {
      description: 'Login',
      notes: 'Returns a accessToken and refreshToken',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          usernameOrEmail: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
      response: {
        status: {
          200: Joi.object({
            id: Joi.number().example(1),
            name: Joi.string().example('John Doe'),
            email: Joi.string().email().example('john@example.com'),
          }).description('Successful response'),
          401: Joi.object({
            error: Joi.string().example('fail'),
            message: Joi.string().example('Username/email or password wrong'),
          }).description('Username/email or password wrong'),
        },
      },
    },
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
