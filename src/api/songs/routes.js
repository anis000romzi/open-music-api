const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/songs',
    handler: handler.postSongHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/songs',
    handler: handler.getSongsHandler,
  },
  {
    method: 'GET',
    path: '/songs/{id}',
    handler: handler.getSongByIdHandler,
  },
  {
    method: 'GET',
    path: '/songs/favorite',
    handler: handler.getFavoriteSongsHandler,
  },
  {
    method: 'GET',
    path: '/songs/recent',
    handler: handler.getRecentSongsHandler,
  },
  {
    method: 'GET',
    path: '/songs/liked',
    handler: handler.getLikedSongsHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/songs/me',
    handler: handler.getOwnedSongsHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/songs/me/singles',
    handler: handler.getOwnedSinglesHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/songs/{id}',
    handler: handler.putSongByIdHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/songs/{id}',
    handler: handler.deleteSongByIdHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'POST',
    path: '/songs/{id}/likes',
    handler: handler.postSongLikeHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/songs/{id}/likes',
    handler: handler.deleteSongLikeHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/songs/{id}/likes',
    handler: handler.getSongLikeHandler,
  },
  {
    method: 'POST',
    path: '/songs/{id}/audios',
    handler: handler.postUploadAudioHandler,
    options: {
      auth: 'openmusic_jwt',
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 100 * 1024 * 1024,
        timeout: false,
        parse: true,
      },
    },
  },
  {
    method: 'POST',
    path: '/songs/{id}/covers',
    handler: handler.postUploadCoverHandler,
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
    path: '/songs/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'file'),
      },
    },
  },
];

module.exports = routes;
