import Hapi from '@hapi/hapi';
import { PlaylistsHandler } from './handler';
import { routes } from './routes';
import { IPlaylistsService } from '../../services/interfaces/IPlaylistsService';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IActivitiesService } from '../../services/interfaces/IActivitiesService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IPlaylistsValidator } from '../../validator/playlists';
import { IUploadsValidator } from '../../validator/uploads';

interface PlaylistsPluginOptions {
  playlistsService: IPlaylistsService;
  songsService: ISongsService;
  activitiesService: IActivitiesService;
  coverStorageService: IStorageService;
  playlistsValidator: IPlaylistsValidator;
  uploadsValidator: IUploadsValidator;
}

export const playlists: Hapi.Plugin<PlaylistsPluginOptions> = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, {
    playlistsService,
    songsService,
    activitiesService,
    coverStorageService,
    playlistsValidator,
    uploadsValidator,
  }) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistsService,
      songsService,
      activitiesService,
      coverStorageService,
      playlistsValidator,
      uploadsValidator,
    );
    server.route(routes(playlistsHandler));
  },
};
