require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');
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

// playlist activities
const ActivitiesService = require('./services/postgres/ActivitiesService');

// message broker
const ProducerService = require('./services/rabbitmq/ProducerService');

// uploads
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const collaborationsService = new CollaborationsService();
  const genresService = new GenresService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const usersService = new UsersService(cacheService);
  const authenticationsService = new AuthenticationsService();
  const activitiesService = new ActivitiesService();
  const coverStorageService = new StorageService(path.resolve(__dirname, 'api/albums/file/cover'));
  const audioStorageService = new StorageService(path.resolve(__dirname, 'api/songs/file/audio'));
  const songCoverStorageService = new StorageService(path.resolve(__dirname, 'api/songs/file/cover'));
  const playlistCoverStorageService = new StorageService(path.resolve(__dirname, 'api/playlists/file/cover'));
  const pictureStorageService = new StorageService(path.resolve(__dirname, 'api/users/file/picture'));

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
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
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
        err: response.message,
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();
