const ReportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'reports',
  version: '1.0.0',
  register: async (server, { reportsService, reportsValidator }) => {
    const reportsHandler = new ReportsHandler(reportsService, reportsValidator);
    server.route(routes(reportsHandler));
  },
};
