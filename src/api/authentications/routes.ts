import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { AuthenticationsHandler } from './handler';

export const routes = (handler: AuthenticationsHandler): Hapi.ServerRoute[] => [
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler,
    options: {
      description: 'Login',
      notes: 'Returns an accessToken in the body and sets the refresh token as an HTTP-only `refresh-token` cookie',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          usernameOrEmail: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            201: {
              description: 'Logged in',
              schema: Joi.object({
                status: Joi.string().example('success'),
                data: Joi.object({
                  accessToken: Joi.string().example('eyJhbGciOi...'),
                }),
              }).label('LoginResponse'),
            },
            401: {
              description: 'Wrong username/email or password, or the account is banned',
              schema: Joi.object({
                status: Joi.string().example('fail'),
                message: Joi.string().example('Username/email or password wrong'),
              }).label('LoginError'),
            },
          },
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
