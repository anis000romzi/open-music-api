import Hapi from '@hapi/hapi';
import { HistoryHandler } from './handler';
import { routes } from './routes';
import { IHistoryService } from '../../services/interfaces/IHistoryService';
import { ISongsService } from '../../services/interfaces/ISongsService';

interface HistoryPluginOptions {
  historyService: IHistoryService;
  songsService: ISongsService;
}

export const history: Hapi.Plugin<HistoryPluginOptions> = {
  name: 'history',
  version: '1.0.0',
  register: async (server, { historyService, songsService }) => {
    const historyHandler = new HistoryHandler(historyService, songsService);
    server.route(routes(historyHandler));
  },
};
