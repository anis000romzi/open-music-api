import Hapi from '@hapi/hapi';
import { CollaborationsHandler } from './handler';
import { routes } from './routes';
import { ICollaborationsService } from '../../services/interfaces/ICollaborationsService';
import { IPlaylistsService } from '../../services/interfaces/IPlaylistsService';
import { IUsersService } from '../../services/interfaces/IUsersService';
import { ICollaborationsValidator } from '../../validator/collaborations';

interface CollaborationsPluginOptions {
  collaborationsService: ICollaborationsService;
  playlistsService: IPlaylistsService;
  usersService: IUsersService;
  validator: ICollaborationsValidator;
}

export const collaborations: Hapi.Plugin<CollaborationsPluginOptions> = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, {
    collaborationsService, playlistsService, usersService, validator,
  }) => {
    const collaborationsHandler = new CollaborationsHandler(
      collaborationsService,
      playlistsService,
      usersService,
      validator,
    );
    server.route(routes(collaborationsHandler));
  },
};
