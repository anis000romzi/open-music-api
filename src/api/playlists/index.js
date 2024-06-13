const PlaylistsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, {
    playlistsService,
    songsService,
    activitiesService,
    coverStorageService,
    playlistsValidator,
    uploadsValidator,
  }) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistsService,
      songsService,
      activitiesService,
      coverStorageService,
      playlistsValidator,
      uploadsValidator,
    );
    server.route(routes(playlistsHandler));
  },
};
