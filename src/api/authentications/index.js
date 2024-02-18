const AuthenticationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'authentications',
  version: '1.0.0',
  register: async (server, {
    cacheService, authenticationsService, producerService, usersService, tokenManager, validator,
  }) => {
    const authenticationsHandler = new AuthenticationsHandler(
      cacheService,
      authenticationsService,
      producerService,
      usersService,
      tokenManager,
      validator,
    );

    server.route(routes(authenticationsHandler));
  },
};
