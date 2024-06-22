/* eslint-disable no-undef */
const PlaylistsTableTestHelper = require('../../../../tests/PlaylistsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const AuthorizationError = require('../../../exceptions/AuthorizationError');
const pool = require('../pool');
const PlaylistsService = require('../PlaylistsService');

describe('PlaylistsService', () => {
  afterEach(async () => {
    await PlaylistsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addPlaylist function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      await expect(playlistsService.addPlaylist({ name: 'Playlist Testing', isPublic: false })).rejects.toThrowError(InvariantError);
    });

    it('should persist after adding a playlist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const playlistsService = new PlaylistsService({});

      // Action
      await playlistsService.addPlaylist({ name: 'Playlist Testing', owner: 'user-123', isPublic: false });

      // Assert
      const playlists = await PlaylistsTableTestHelper.findPlaylistsByName('Playlist Testing');
      expect(playlists).toHaveLength(1);
    });
  });

  describe('getPlaylistById function', () => {
    it('should throw NotFoundError when playlist id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      return expect(playlistsService.getPlaylistById('playlist-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return correct data when playlist id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action
      const playlist = await playlistsService.getPlaylistById('playlist-123');

      // Assert
      expect(playlist).toStrictEqual({
        id: 'playlist-123',
        name: 'Playlist Testing',
        owner: 'user-123',
        created_at: new Date('2024-02-16T14:02:55.751Z'),
        updated_at: new Date('2024-02-16T14:02:55.751Z'),
        cover: null,
        is_public: false,
        username: 'testing',
        owner_id: 'user-123',
      });
    });
  });

  describe('verifyPlaylistAccess function', () => {
    it('should throw NotFoundError when playlist id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      return expect(playlistsService.verifyPlaylistAccess('playlist-456', 'user-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when playlist owner and user id not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw any error when playlist id found and user id match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-123')).resolves.not.toThrowError(NotFoundError);
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('editPlaylistById function', () => {
    it('should throw NotFoundError when playlist id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      // Action & Assert
      await expect(playlistsService.editPlaylistById({ id: 'playlist-456', name: 'Playlist edit', isPublic: false })).rejects.toThrowError(NotFoundError);
    });

    it('should update the correct playlist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = new PlaylistsService({});

      await playlistsService.editPlaylistById({ id: 'playlist-123', name: 'Playlist edit', isPublic: true });
      const updatedPlaylist = await PlaylistsTableTestHelper.findPlaylistsById('playlist-123');

      // Action & Assert
      expect(updatedPlaylist[0].name).toStrictEqual('Playlist edit');
      expect(updatedPlaylist[0].is_public).toStrictEqual(true);
    });
  });
});
