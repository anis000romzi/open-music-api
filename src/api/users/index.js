const UsersHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'users',
  version: '2.0.0',
  register: async (server, {
    usersService, albumsService, storageService, uploadsValidator, usersValidator,
  }) => {
    const usersHandler = new UsersHandler(
      usersService,
      albumsService,
      storageService,
      uploadsValidator,
      usersValidator,
    );
    server.route(routes(usersHandler));
  },
};
