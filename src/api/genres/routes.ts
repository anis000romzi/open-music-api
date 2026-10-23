import Hapi from '@hapi/hapi';
import { GenresHandler } from './handler';

export const routes = (handler: GenresHandler): Hapi.ServerRoute[] => [
  {
    method: 'GET',
    path: '/genres',
    handler: handler.getGenresHandler,
  },
];
