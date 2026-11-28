import PlaylistsTableTestHelper from '../../../../tests/PlaylistsTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import { createMockCacheService } from '../../../../tests/mockCacheService';
import { InvariantError } from '../../../exceptions/InvariantError';
import { NotFoundError } from '../../../exceptions/NotFoundError';
import { AuthorizationError } from '../../../exceptions/AuthorizationError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresCollaborationsService } from '../PostgresCollaborationsService';
import { PostgresPlaylistsService } from '../PostgresPlaylistsService';

const createService = () => new PostgresPlaylistsService(
  prisma,
  new PostgresCollaborationsService(prisma),
  createMockCacheService(),
);

describe('PostgresPlaylistsService', () => {
  afterEach(async () => {
    await PlaylistsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addPlaylist function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const playlistsService = createService();

      // Action & Assert
      // @ts-expect-error: owner is intentionally missing
      await expect(playlistsService.addPlaylist({ name: 'Playlist Testing', isPublic: false })).rejects.toThrow(InvariantError);
    });

    it('should persist after adding a playlist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const playlistsService = createService();

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
      const playlistsService = createService();

      // Action & Assert
      return expect(playlistsService.getPlaylistById('playlist-456'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should return correct data when playlist id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = createService();

      // Action
      const playlist = await playlistsService.getPlaylistById('playlist-123');

      // Assert
      expect(playlist).toStrictEqual({
        id: 'playlist-123',
        name: 'Playlist Testing',
        owner: 'user-123',
        created_at: new Date('2024-02-16T21:02:55.751Z'),
        updated_at: new Date('2024-02-16T21:02:55.751Z'),
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
      const playlistsService = createService();

      // Action & Assert
      return expect(playlistsService.verifyPlaylistAccess('playlist-456', 'user-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when playlist owner and user id not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = createService();

      // Action & Assert
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-456')).rejects.toThrow(AuthorizationError);
    });

    it('should not throw any error when playlist id found and user id match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = createService();

      // Action & Assert
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-123')).resolves.not.toThrow(NotFoundError);
      await expect(playlistsService.verifyPlaylistAccess('playlist-123', 'user-123')).resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('editPlaylistById function', () => {
    it('should throw NotFoundError when playlist id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = createService();

      // Action & Assert
      await expect(playlistsService.editPlaylistById({ id: 'playlist-456', name: 'Playlist edit', isPublic: false })).rejects.toThrow(NotFoundError);
    });

    it('should update the correct playlist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const playlistsService = createService();

      // Action
      await playlistsService.editPlaylistById({ id: 'playlist-123', name: 'Playlist edit', isPublic: true });
      const updatedPlaylist = await PlaylistsTableTestHelper.findPlaylistsById('playlist-123');

      // Assert
      expect(updatedPlaylist[0].name).toStrictEqual('Playlist edit');
      expect(updatedPlaylist[0].is_public).toStrictEqual(true);
    });
  });
});
