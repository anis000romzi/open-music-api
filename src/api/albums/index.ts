import Hapi from '@hapi/hapi';
import { AlbumsHandler } from './handler';
import { routes } from './routes';
import { IAlbumsService } from '../../services/interfaces/IAlbumsService';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IAlbumsValidator } from '../../validator/albums';
import { IUploadsValidator } from '../../validator/uploads';

interface AlbumsPluginOptions {
  albumsService: IAlbumsService;
  songsService: ISongsService;
  storageService: IStorageService;
  albumsValidator: IAlbumsValidator;
  uploadsValidator: IUploadsValidator;
}

export const albums: Hapi.Plugin<AlbumsPluginOptions> = {
  name: 'albums',
  version: '3.0.0',
  register: async (server, options) => {
    const {
      albumsService,
      songsService,
      storageService,
      albumsValidator,
      uploadsValidator,
    } = options;

    const albumsHandler = new AlbumsHandler(
      albumsService,
      songsService,
      storageService,
      albumsValidator,
      uploadsValidator,
    );

    server.route(routes(albumsHandler));
  },
};
