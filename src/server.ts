import 'dotenv/config';

import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Jwt from '@hapi/jwt';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import { v4 as uuidv4 } from 'uuid';
import { ClientError } from './exceptions/ClientError';
import { NotFoundError } from './exceptions/NotFoundError';

import * as Swagger from 'hapi-swagger';

// albums
import { albums } from './api/albums';
import { PostgresAlbumsService } from './services/postgres/PostgresAlbumsService';
import { IAlbumsService } from './services/interfaces/IAlbumsService';
import { AlbumsValidator } from './validator/albums';

// songs
import { songs } from './api/songs';
import { PostgresSongsService } from './services/postgres/PostgresSongsService';
import { ISongsService } from './services/interfaces/ISongsService';
import { SongsValidator } from './validator/songs';

// playlists
import { playlists } from './api/playlists';
import { PostgresPlaylistsService } from './services/postgres/PostgresPlaylistsService';
import { IPlaylistsService } from './services/interfaces/IPlaylistsService';
import { PlaylistsValidator } from './validator/playlists';

// users
import { users } from './api/users';
import { PostgresUsersService } from './services/postgres/PostgresUsersService';
import { IUsersService } from './services/interfaces/IUsersService';
import { UsersValidator } from './validator/users';

// authentications
import { authentications } from './api/authentications';
import { PostgresAuthenticationsService } from './services/postgres/PostgresAuthenticationsService';
import { IAuthenticationsService } from './services/interfaces/IAuthenticationsService';
import { TokenManager } from './tokenize/TokenManager';
import { AuthenticationsValidator } from './validator/authentications';

// collaborations
import { collaborations } from './api/collaborations';
import { PostgresCollaborationsService } from './services/postgres/PostgresCollaborationsService';
import { ICollaborationsService } from './services/interfaces/ICollaborationsService';
import { CollaborationsValidator } from './validator/collaborations';

// genres
import { genres } from './api/genres';
import { PostgresGenresService } from './services/postgres/PostgresGenresService';
import { IGenresService } from './services/interfaces/IGenresService';

// history
import { history } from './api/history';
import { PostgresHistoryService } from './services/postgres/PostgresHistoryService';
import { IHistoryService } from './services/interfaces/IHistoryService';

// reports
import { reports } from './api/reports';
import { PostgresReportsService } from './services/postgres/PostgresReportsService';
import { IReportsService } from './services/interfaces/IReportsService';
import { ReportsValidator } from './validator/reports';

// playlist activities
import { PostgresActivitiesService } from './services/postgres/PostgresActivitiesService';
import { IActivitiesService } from './services/interfaces/IActivitiesService';

// message broker
import { RabbitMQProducerService } from './services/rabbitmq/RabbitMQProducerService';
import { IProducerService } from './services/interfaces/IProducerService';

// uploads
import { IStorageService } from './services/interfaces/IStorageService';
import { S3StorageService } from './services/storage/S3StorageService';
import { UploadsValidator } from './validator/uploads';

// cache
import { RedisCacheService } from './services/cache/RedisCacheService';
import { ICacheService } from './services/interfaces/ICacheService';

// logger
import { WinstonLoggerService } from './services/logger/WinstonLoggerService';
import { ILoggerService } from './services/interfaces/ILoggerService';

// helpers
import redact from './helpers/redact';
import prisma from './helpers/prisma';

const init = async () => {
  const cacheService: ICacheService = new RedisCacheService();
  const albumsService: IAlbumsService = new PostgresAlbumsService(
    prisma,
    cacheService,
  );
  const songsService: ISongsService = new PostgresSongsService(prisma, cacheService);
  const collaborationsService: ICollaborationsService = new PostgresCollaborationsService(prisma);
  const genresService: IGenresService = new PostgresGenresService(prisma);
  const historyService: IHistoryService = new PostgresHistoryService(prisma);
  const reportsService: IReportsService = new PostgresReportsService(prisma);
  const playlistsService: IPlaylistsService = new PostgresPlaylistsService(
    prisma,
    collaborationsService,
    cacheService,
  );
  const usersService: IUsersService = new PostgresUsersService(prisma, cacheService);
  const authenticationsService: IAuthenticationsService = new PostgresAuthenticationsService(
    prisma,
  );
  const producerService: IProducerService = new RabbitMQProducerService();
  const activitiesService: IActivitiesService = new PostgresActivitiesService(prisma);
  const coverStorageService: IStorageService = new S3StorageService();
  const audioStorageService: IStorageService = new S3StorageService();
  const songCoverStorageService: IStorageService = new S3StorageService();
  const playlistCoverStorageService: IStorageService = new S3StorageService();
  const pictureStorageService: IStorageService = new S3StorageService();
  const loggerService: ILoggerService = new WinstonLoggerService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['https://app.myfreetunes.xyz', 'http://localhost:3000'],
        headers: ['Accept', 'Content-Type', 'Authorization'],
        credentials: true,
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
    {
      plugin: Vision,
    },
    {
      plugin: Swagger,
      options: {
        info: {
          title: 'Open Music API',
          version: '1.0.0',
        },
        jsonPath: '/swagger.json',
      },
    },
  ]);

  const findTokenUser = async (userId: string) => {
    try {
      return await usersService.getUserById(userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  };

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: async (artifacts) => {
      const user = await findTokenUser(artifacts.decoded.payload.id);

      if (!user || !user.is_active || user.is_banned === true) {
        return { isValid: false };
      }

      return {
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
        },
      };
    },
  });

  server.auth.strategy('openmusic_jwt_2', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    // Same as openmusic_jwt but lets unverified (inactive) users through, for
    // /users/me and changing the email before verification. Banned users are
    // still rejected.
    validate: async (artifacts) => {
      const user = await findTokenUser(artifacts.decoded.payload.id);

      if (!user || user.is_banned === true) {
        return { isValid: false };
      }

      return {
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
        },
      };
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        songsService,
        storageService: coverStorageService,
        albumsValidator: AlbumsValidator,
        uploadsValidator: UploadsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        songsService,
        audioStorageService,
        coverStorageService: songCoverStorageService,
        songsValidator: SongsValidator,
        uploadsValidator: UploadsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        activitiesService,
        coverStorageService: playlistCoverStorageService,
        playlistsValidator: PlaylistsValidator,
        uploadsValidator: UploadsValidator,
      },
    },
    {
      plugin: users,
      options: {
        usersService,
        albumsService,
        songsService,
        storageService: pictureStorageService,
        uploadsValidator: UploadsValidator,
        usersValidator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        cacheService,
        authenticationsService,
        producerService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: genres,
      options: {
        genresService,
      },
    },
    {
      plugin: history,
      options: {
        historyService,
        songsService,
      },
    },
    {
      plugin: reports,
      options: {
        reportsService,
        reportsValidator: ReportsValidator,
      },
    },
  ]);

  server.route({
    method: 'GET',
    path: '/docs',
    handler: (request, h) => h.file('./public/rapidoc.html'),
  });

  server.ext('onRequest', (request, h) => {
    request.app.requestId = uuidv4();
    request.plugins.startTime = Date.now();
    return h.continue;
  });

  server.ext(
    'onPreResponse',
    (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const {
        method, path, payload, headers, response,
      } = request;

      const statusCode = (response as Boom.Boom)?.isBoom
        ? (response as Boom.Boom).output.statusCode
        : (response as Hapi.ResponseObject).statusCode;
      const duration = Date.now() - request.plugins.startTime;
      const { requestId } = request.app;

      let responseBody = '';
      if (response && !(response as Boom.Boom).isBoom) {
        const res = response as Hapi.ResponseObject;
        if (typeof res.source === 'object') {
          responseBody = JSON.stringify(res.source);
        }
      } else if ((response as Boom.Boom)?.output?.payload) {
        responseBody = JSON.stringify((response as Boom.Boom).output.payload);
      }

      loggerService.info(
        `
        [RequestID: ${requestId}] ${method.toUpperCase()} ${path} ${statusCode} - ${duration}ms
        Request Headers: ${JSON.stringify(redact(headers))}
        Request Payload: ${JSON.stringify(redact(payload))}
        Response Body: ${responseBody}
      `.trim(),
      );

      if (response instanceof Error) {
        if (response instanceof ClientError) {
          const { statusCode: code } = response;
          const newResponse = h.response({
            status: 'fail',
            message: response.message,
          });
          newResponse.code(code);

          loggerService.warn(`Error ${code}: ${response.message}`);
          return newResponse;
        }

        if (response instanceof ClientError === false) {
          return h.continue;
        }

        const newResponse = h.response({
          status: 'error',
          message: 'there is a failure on our server',
        });
        newResponse.code(500);

        loggerService.error(`Error 500: ${response.message}`);
        return newResponse;
      }

      return h.continue;
    },
  );

  const routes = server.table() as any[];
  const grouped: Record<string, Array<{ method: string; path: string }>> = {};

  routes.forEach((route) => {
    const pluginName = route.realm.plugin || 'root';
    if (!grouped[pluginName]) {
      grouped[pluginName] = [];
    }

    grouped[pluginName].push({
      method: route.method.toUpperCase(),
      path: route.path,
    });
  });

  Object.entries(grouped).forEach(([pluginName, pluginRoutes]) => {
    loggerService.info(`📦 Plugin: ${pluginName}`);
    (pluginRoutes as Array<{ method: string; path: string }>).forEach(
      (route) => {
        loggerService.info(`[${route.method}] ${route.path}`);
      },
    );
  });

  await server.start();
  loggerService.log(`✅ Server running on ${server.info.uri}`);
  loggerService.log(`📃 Documentations url on ${server.info.uri}/docs`);
};

init();
