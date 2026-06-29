import Hapi from '@hapi/hapi';
import { SongsHandler } from './handler';
import { routes } from './routes';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { ISongsValidator } from '../../validator/songs';
import { IUploadsValidator } from '../../validator/uploads';

interface SongsPluginOptions {
  songsService: ISongsService;
  audioStorageService: IStorageService;
  coverStorageService: IStorageService;
  songsValidator: ISongsValidator;
  uploadsValidator: IUploadsValidator;
}

export const songs: Hapi.Plugin<SongsPluginOptions> = {
  name: 'songs',
  version: '1.0.0',
  register: async (
    server,
    {
      songsService,
      audioStorageService,
      coverStorageService,
      songsValidator,
      uploadsValidator,
    },
  ) => {
    const songsHandler = new SongsHandler(
      songsService,
      audioStorageService,
      coverStorageService,
      songsValidator,
      uploadsValidator,
    );
    server.route(routes(songsHandler));
  },
};
