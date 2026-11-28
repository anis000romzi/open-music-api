import Hapi from '@hapi/hapi';
import { CollaborationsHandler } from './handler';

export const routes = (handler: CollaborationsHandler): Hapi.ServerRoute[] => [
  {
    method: 'POST',
    path: '/collaborations',
    handler: handler.postCollaborationHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/collaborations',
    handler: handler.deleteCollaborationHandler,
    options: {
      auth: 'openmusic_jwt',
    },
  },
];
