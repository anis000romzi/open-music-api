const HistoryHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'history',
  version: '1.0.0',
  register: async (server, { historyService, songsService }) => {
    const historyHandler = new HistoryHandler(historyService, songsService);
    server.route(routes(historyHandler));
  },
};
