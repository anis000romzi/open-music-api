/* eslint-disable no-undef */
const AlbumsTableTestHelper = require('../../../../tests/AlbumsTableTestHelper');
const SongsTableTestHelper = require('../../../../tests/SongsTableTestHelper');
const GenresTableTestHelper = require('../../../../tests/GenresTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const AuthorizationError = require('../../../exceptions/AuthorizationError');
const pool = require('../pool');
const SongsService = require('../SongsService');

describe('SongsService', () => {
  afterEach(async () => {
    await AlbumsTableTestHelper.cleanTable();
    await SongsTableTestHelper.cleanTable();
    await GenresTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addSong function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      const songsService = new SongsService();

      // Action & Assert
      await expect(songsService.addSong({
        year: '2022', genre: '1', duration: 100, albumId: 'album-123',
      }, 'user-123')).rejects.toThrowError(InvariantError);
    });

    it('should persist after adding a song', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      const songsService = new SongsService();

      // Action
      await songsService.addSong({
        title: 'Song testing', year: '2022', genre: '1', duration: 100, albumId: 'album-123',
      }, 'user-123');

      // Assert
      const songs = await SongsTableTestHelper.findSongsByTitle('Song testing');
      expect(songs).toHaveLength(1);
    });
  });

  describe('getSongById function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      return expect(songsService.getSongById('song-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return correct data when song id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action
      const song = await songsService.getSongById('song-123');

      // Assert
      expect(song).toStrictEqual({
        id: 'song-123',
        title: 'Song Testing',
        album: 'Album Testing',
        year: 2022,
        artist: 'Testing testing',
        artist_id: 'user-123',
        genre: 'pop',
        genre_id: '1',
        duration: 100,
        audio: null,
        cover: null,
      });
    });
  });

  describe('verifySongArtist function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      return expect(songsService.verifySongArtist('song-456', 'user-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when song artist and user id not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      await expect(songsService.verifySongArtist('song-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw any error when song id found and user id match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      await expect(songsService.verifySongArtist('song-123', 'user-123')).resolves.not.toThrowError(NotFoundError);
      await expect(songsService.verifySongArtist('song-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('editSongById function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      await expect(songsService.editSongById('song-456', {
        title: 'Song edit', year: 2024, genre: '1', duration: 100, albumId: 'album-123',
      })).rejects.toThrowError(NotFoundError);
    });

    it('should update the correct song', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      await songsService.editSongById('song-123', {
        title: 'Song edit', year: 2024, genre: '1', duration: 100, albumId: 'album-123',
      });
      const updatedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Action & Assert
      expect(updatedSong[0].title).toStrictEqual('Song edit');
      expect(updatedSong[0].year).toStrictEqual(2024);
    });
  });

  describe('addAudioToSong function', () => {
    it('should add audio to the correct song', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action
      await songsService.addAudioToSong('song-123', 'path/to/file');
      const updatedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Assert
      expect(updatedSong[0].audio).toStrictEqual('path/to/file');
    });
  });

  describe('addCoverToSong function', () => {
    it('should add cover to the correct song', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action
      await songsService.addCoverToSong('song-123', 'path/to/file');
      const updatedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Assert
      expect(updatedSong[0].cover).toStrictEqual('path/to/file');
    });
  });

  describe('deleteSongById function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action & Assert
      await expect(songsService.deleteSongById('song-456')).rejects.toThrowError(NotFoundError);
    });

    it('should delete the correct album', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      await SongsTableTestHelper.addSong({ id: 'song-123' });
      const songsService = new SongsService();

      // Action
      await songsService.deleteSongById('song-123');
      const deletedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Assert
      expect(deletedSong.length).toStrictEqual(0);
    });
  });
});
