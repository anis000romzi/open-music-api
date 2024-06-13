/* eslint-disable no-undef */
const AlbumsTableTestHelper = require('../../../../tests/AlbumsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../exceptions/NotFoundError');
const AuthorizationError = require('../../../exceptions/AuthorizationError');
const pool = require('../pool');
const AlbumsService = require('../AlbumsService');

describe('AlbumsService', () => {
  afterEach(async () => {
    await AlbumsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addAlbum function', () => {
    it('should persist after adding a album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const albumsService = new AlbumsService();

      // Action
      await albumsService.addAlbum({ name: 'Album testing', year: '2022' }, 'user-123');

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
      const albumsService = new AlbumsService();

      // Action & Assert
      return expect(albumsService.getAlbumById('album-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return correct data when album id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

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
      const albumsService = new AlbumsService();

      // Action & Assert
      return expect(albumsService.verifyAlbumArtist('album-456', 'user-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when album id and user id not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

      // Action & Assert
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw any error when album id found and user id match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

      // Action & Assert
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-123')).resolves.not.toThrowError(NotFoundError);
      await expect(albumsService.verifyAlbumArtist('album-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('editAlbumById function', () => {
    it('should throw NotFoundError when album id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

      // Action & Assert
      await expect(albumsService.editAlbumById('album-456', { name: 'Album edit', year: 2024 })).rejects.toThrowError(NotFoundError);
    });

    it('should update the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

      await albumsService.editAlbumById('album-123', { name: 'Album edit', year: '2024' });
      const updatedAlbum = await AlbumsTableTestHelper.findAlbumsById('album-123');

      // Action & Assert
      expect(updatedAlbum[0].name).toStrictEqual('Album edit');
      expect(updatedAlbum[0].year).toStrictEqual(2024);
    });
  });

  describe('addCoverToAlbum function', () => {
    it('should add cover to the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

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
      const albumsService = new AlbumsService();

      // Action & Assert
      await expect(albumsService.deleteAlbumById('album-456')).rejects.toThrowError(NotFoundError);
    });

    it('should delete the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      const albumsService = new AlbumsService();

      // Action
      await albumsService.deleteAlbumById('album-123');
      const deletedAlbum = await AlbumsTableTestHelper.findAlbumsById('album-123');

      // Assert
      expect(deletedAlbum.length).toStrictEqual(0);
    });
  });
});
