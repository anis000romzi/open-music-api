const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '3.0.0',
  register: async (server, {
    albumsService, songsService, storageService, albumsValidator, uploadsValidator,
  }) => {
    const albumsHandler = new AlbumsHandler(
      albumsService,
      songsService,
      storageService,
      albumsValidator,
      uploadsValidator,
    );
    server.route(routes(albumsHandler));
  },
};
