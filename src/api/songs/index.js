const SongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'songs',
  version: '1.0.0',
  register: async (server, {
    songsService, storageService, songsValidator, uploadsValidator,
  }) => {
    const songsHandler = new SongsHandler(
      songsService,
      storageService,
      songsValidator,
      uploadsValidator,
    );
    server.route(routes(songsHandler));
  },
};
