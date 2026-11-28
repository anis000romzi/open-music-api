import AlbumsTableTestHelper from '../../../../tests/AlbumsTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import { createMockCacheService } from '../../../../tests/mockCacheService';
import { InvariantError } from '../../../exceptions/InvariantError';
import { NotFoundError } from '../../../exceptions/NotFoundError';
import { AuthorizationError } from '../../../exceptions/AuthorizationError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresAlbumsService } from '../PostgresAlbumsService';

const createService = () => new PostgresAlbumsService(prisma, createMockCacheService());

describe('PostgresAlbumsService', () => {
  afterEach(async () => {
    await AlbumsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addAlbum function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const albumsService = createService();

      // Action & Assert
      // @ts-expect-error: year is intentionally missing
      await expect(albumsService.addAlbum({ name: 'Album testing' }, 'user-123')).rejects.toThrow(InvariantError);
    });

    it('should persist after adding a album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const albumsService = createService();

      // Action
      await albumsService.addAlbum({ name: 'Album testing', year: 2022 }, 'user-123');

      // Assert
      const albums = await AlbumsTableTestHelper.findAlbumsByName('Album testing');
      expect(albums).toHaveLength(1);
    });
  });

  describe('getAlbumById function', () => {
    it('should throw NotFoundError when album id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      return expect(albumsService.getAlbumById('album-456'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should return correct data when album id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action
      const album = await albumsService.getAlbumById('album-123');

      // Assert
      expect(album).toStrictEqual({
        id: 'album-123',
        name: 'Album Testing',
        year: 2022,
        cover: null,
        artist: 'Testing testing',
        artist_id: 'user-123',
      });
    });
  });

  describe('verifyAlbumArtist function', () => {
    it('should throw NotFoundError when album id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      return expect(albumsService.verifyAlbumArtist('album-456', 'user-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when album artist and user id not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-456')).rejects.toThrow(AuthorizationError);
    });

    it('should not throw any error when album id found and user id match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-123')).resolves.not.toThrow(NotFoundError);
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-123')).resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('editAlbumById function', () => {
    it('should throw NotFoundError when album id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      await expect(albumsService.editAlbumById('album-456', { name: 'Album edit', year: 2024 })).rejects.toThrow(NotFoundError);
    });

    it('should update the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action
      await albumsService.editAlbumById('album-123', { name: 'Album edit', year: 2024 });
      const updatedAlbum = await AlbumsTableTestHelper.findAlbumsById('album-123');

      // Assert
      expect(updatedAlbum[0].name).toStrictEqual('Album edit');
      expect(updatedAlbum[0].year).toStrictEqual(2024);
    });
  });

  describe('addCoverToAlbum function', () => {
    it('should add cover to the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action
      await albumsService.addCoverToAlbum('album-123', 'path/to/file');
      const updatedAlbum = await AlbumsTableTestHelper.findAlbumsById('album-123');

      // Assert
      expect(updatedAlbum[0].cover).toStrictEqual('path/to/file');
    });
  });

  describe('deleteAlbumById function', () => {
    it('should throw NotFoundError when album id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action & Assert
      await expect(albumsService.deleteAlbumById('album-456')).rejects.toThrow(NotFoundError);
    });

    it('should delete the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = createService();

      // Action
      await albumsService.deleteAlbumById('album-123');
      const deletedAlbum = await AlbumsTableTestHelper.findAlbumsById('album-123');

      // Assert
      expect(deletedAlbum.length).toStrictEqual(0);
    });
  });
});
