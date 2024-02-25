const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    handler: handler.putUserByIdHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'POST',
    path: '/users/{id}/verify',
    handler: handler.verifyUserHandler,
  },
  {
    method: 'PUT',
    path: '/users/{id}/resetpassword',
    handler: handler.resetUserPasswordHandler,
  },
  {
    method: 'PUT',
    path: '/users/{id}/editemail',
    handler: handler.editUserEmailHandler,
  },
  {
    method: 'POST',
    path: '/users/{id}/pictures',
    handler: handler.postUploadPictureHandler,
    options: {
      auth: 'openmusic_jwt',
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 512000,
      },
    },
  },
  {
    method: 'GET',
    path: '/users/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'file'),
      },
    },
  },
];

module.exports = routes;
