import Hapi from '@hapi/hapi';
import { UsersHandler } from './handler';
import { routes } from './routes';
import { IUsersService } from '../../services/interfaces/IUsersService';
import { IAlbumsService } from '../../services/interfaces/IAlbumsService';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IUploadsValidator } from '../../validator/uploads';
import { IUsersValidator } from '../../validator/users';

interface UsersPluginOptions {
  usersService: IUsersService;
  albumsService: IAlbumsService;
  songsService: ISongsService;
  storageService: IStorageService;
  uploadsValidator: IUploadsValidator;
  usersValidator: IUsersValidator;
}

export const users: Hapi.Plugin<UsersPluginOptions> = {
  name: 'users',
  version: '2.0.0',
  register: async (server, {
    usersService, albumsService, songsService, storageService, uploadsValidator, usersValidator,
  }) => {
    const usersHandler = new UsersHandler(
      usersService,
      albumsService,
      songsService,
      storageService,
      uploadsValidator,
      usersValidator,
    );
    server.route(routes(usersHandler));
  },
};
