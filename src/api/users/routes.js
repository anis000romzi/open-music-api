const path = require('path');

const routes = (handler) => [
  {
    method: 'GET',
    path: '/users',
    handler: handler.getUsersHandler,
  },
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
  },
  {
    method: 'GET',
    path: '/users/popular',
    handler: handler.getPopularUsersHandler,
  },
  {
    method: 'GET',
    path: '/users/me',
    handler: handler.getLoggedUserHandler,
    options: {
      auth: 'openmusic_jwt_2',
    },
  },
  {
    method: 'GET',
    path: '/users/followed',
    handler: handler.getFollowedUsersHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: handler.getUserByIdHandler,
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
    path: '/users/{id}/follow',
    handler: handler.postFollowArtistHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/users/{id}/follow',
    handler: handler.deleteFollowArtistHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/users/{id}/follow',
    handler: handler.getArtistFollowerHandler,
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
        maxBytes: 102400000,
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
