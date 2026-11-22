import Hapi from '@hapi/hapi';
import { AuthenticationsHandler } from './handler';
import { routes } from './routes';
import { IAuthenticationsService } from '../../services/interfaces/IAuthenticationsService';
import { ICacheService } from '../../services/interfaces/ICacheService';
import { IProducerService } from '../../services/interfaces/IProducerService';
import { IUsersService } from '../../services/interfaces/IUsersService';
import { ITokenManager } from '../../tokenize/TokenManager';
import { IAuthenticationsValidator } from '../../validator/authentications';

interface AuthenticationsPluginOptions {
  cacheService: ICacheService;
  authenticationsService: IAuthenticationsService;
  producerService: IProducerService;
  usersService: IUsersService;
  tokenManager: ITokenManager;
  validator: IAuthenticationsValidator;
}

export const authentications: Hapi.Plugin<AuthenticationsPluginOptions> = {
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
