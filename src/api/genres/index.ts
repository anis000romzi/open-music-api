import Hapi from '@hapi/hapi';
import { GenresHandler } from './handler';
import { routes } from './routes';
import { IGenresService } from '../../services/interfaces/IGenresService';

interface GenresPluginOptions {
  genresService: IGenresService;
}

export const genres: Hapi.Plugin<GenresPluginOptions> = {
  name: 'genres',
  version: '1.0.0',
  register: async (server, { genresService }) => {
    const genresHandler = new GenresHandler(genresService);
    server.route(routes(genresHandler));
  },
};
