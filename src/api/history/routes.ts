import Hapi from '@hapi/hapi';
import { HistoryHandler } from './handler';

export const routes = (handler: HistoryHandler): Hapi.ServerRoute[] => [
  {
    method: 'POST',
    path: '/history',
    handler: handler.postHistoryHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/history',
    handler: handler.getHistoryHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
];
