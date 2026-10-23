import Hapi from '@hapi/hapi';
import { ReportsHandler } from './handler';

export const routes = (handler: ReportsHandler): Hapi.ServerRoute[] => [
  {
    method: 'POST',
    path: '/reports',
    handler: handler.postReportHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
];
