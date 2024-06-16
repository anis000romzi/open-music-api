const GenresService = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'genres',
  version: '1.0.0',
  register: async (server, { genresService }) => {
    const genresHandler = new GenresService(genresService);
    server.route(routes(genresHandler));
  },
};
