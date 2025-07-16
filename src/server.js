require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const ClientError = require('./exceptions/ClientError');

// albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// playlists
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// genres
const genres = require('./api/genres');
const GenresService = require('./services/postgres/GenresService');

// history
const history = require('./api/history');
const HistoryService = require('./services/postgres/HistoryService');

// reports
const reports = require('./api/reports');
const ReportsService = require('./services/postgres/ReportsService');
const ReportsValidator = require('./validator/reports');

// playlist activities
const ActivitiesService = require('./services/postgres/ActivitiesService');

// message broker
const ProducerService = require('./services/rabbitmq/ProducerService');

// uploads
const StorageService = require('./services/S3/StorageService');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

// logger
const LoggerService = require('./services/logger/LoggerService');

// helpers
const redact = require('./helpers/redact');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService(cacheService);
  const collaborationsService = new CollaborationsService();
  const genresService = new GenresService();
  const historyService = new HistoryService();
  const reportsService = new ReportsService();
  const playlistsService = new PlaylistsService(collaborationsService, cacheService);
  const usersService = new UsersService(cacheService);
  const authenticationsService = new AuthenticationsService();
  const activitiesService = new ActivitiesService();
  const coverStorageService = new StorageService();
  const audioStorageService = new StorageService();
  const songCoverStorageService = new StorageService();
  const playlistCoverStorageService = new StorageService();
  const pictureStorageService = new StorageService();
  const loggerService = new LoggerService();

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
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: async (artifacts) => {
      const user = await usersService.getUserById(artifacts.decoded.payload.id);

      if (!user || !user.is_active) {
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
    validate: async (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
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
        producerService: ProducerService,
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

  server.ext('onPreResponse', (request, h) => {
    const {
      method,
      path,
      payload,
      headers,
      response,
    } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);

        loggerService.warn(`Error ${response.statusCode}: ${response.message}`);
        return newResponse;
      }

      if (!response.isServer) {
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

    const statusCode = response?.statusCode || response?.output?.statusCode;
    const duration = Date.now() - request.plugins.startTime;

    let responseBody = '';
    if (response && !response.isBoom && typeof response.source === 'object') {
      responseBody = JSON.stringify(response.source);
    } else if (response?.output?.payload) {
      responseBody = JSON.stringify(response.output.payload);
    }

    loggerService.info(
      `
      ${method.toUpperCase()} ${path} ${statusCode} - ${duration}ms
      Request Headers: ${JSON.stringify(redact(headers))}
      Request Payload: ${JSON.stringify(redact(payload))}
      Response Body: ${responseBody}
      `.trim(),
    );

    return h.continue;
  });

  await server.start();
  loggerService.log(`Server running on ${server.info.uri}`);
};

init();
