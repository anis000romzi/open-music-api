import AlbumsTableTestHelper from '../../../../tests/AlbumsTableTestHelper';
import SongsTableTestHelper from '../../../../tests/SongsTableTestHelper';
import GenresTableTestHelper from '../../../../tests/GenresTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import { createMockCacheService } from '../../../../tests/mockCacheService';
import { InvariantError } from '../../../exceptions/InvariantError';
import { NotFoundError } from '../../../exceptions/NotFoundError';
import { AuthorizationError } from '../../../exceptions/AuthorizationError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresSongsService } from '../PostgresSongsService';

const createService = () => new PostgresSongsService(prisma, createMockCacheService());

const arrangeSong = async () => {
  await UsersTableTestHelper.addUser({ id: 'user-123' });
  await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
  await GenresTableTestHelper.addGenre({ id: '1' });
  await SongsTableTestHelper.addSong({ id: 'song-123' });
};

describe('PostgresSongsService', () => {
  afterEach(async () => {
    await AlbumsTableTestHelper.cleanTable();
    await SongsTableTestHelper.cleanTable();
    await GenresTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addSong function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      const songsService = createService();

      // Action & Assert
      // @ts-expect-error: title is intentionally missing
      await expect(songsService.addSong({
        year: 2022, genre: '1', duration: 100, albumId: 'album-123',
      }, 'user-123')).rejects.toThrow(InvariantError);
    });

    it('should persist after adding a song', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await AlbumsTableTestHelper.addAlbum({ id: 'album-123' });
      await GenresTableTestHelper.addGenre({ id: '1' });
      const songsService = createService();

      // Action
      await songsService.addSong({
        title: 'Song testing', year: 2022, genre: '1', duration: 100, albumId: 'album-123',
      }, 'user-123');

      // Assert
      const songs = await SongsTableTestHelper.findSongsByTitle('Song testing');
      expect(songs).toHaveLength(1);
    });
  });

  describe('getSongById function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      return expect(songsService.getSongById('song-456'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should return correct data when song id found', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

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
        listened: null,
        audio: null,
        cover: null,
      });
    });
  });

  describe('verifySongArtist function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      return expect(songsService.verifySongArtist('song-456', 'user-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when song artist and user id not match', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      await expect(songsService.verifySongArtist('song-123', 'user-456')).rejects.toThrow(AuthorizationError);
    });

    it('should not throw any error when song id found and user id match', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      await expect(songsService.verifySongArtist('song-123', 'user-123')).resolves.not.toThrow(NotFoundError);
      await expect(songsService.verifySongArtist('song-123', 'user-123')).resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('editSongById function', () => {
    it('should throw NotFoundError when song id not found', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      await expect(songsService.editSongById('song-456', {
        title: 'Song edit', year: 2024, genre: '1', duration: 100, albumId: 'album-123',
      })).rejects.toThrow(NotFoundError);
    });

    it('should update the correct song', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action
      await songsService.editSongById('song-123', {
        title: 'Song edit', year: 2024, genre: '1', duration: 100, albumId: 'album-123',
      });
      const updatedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Assert
      expect(updatedSong[0].title).toStrictEqual('Song edit');
      expect(updatedSong[0].year).toStrictEqual(2024);
    });
  });

  describe('addAudioToSong function', () => {
    it('should add audio to the correct song', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

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
      await arrangeSong();
      const songsService = createService();

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
      await arrangeSong();
      const songsService = createService();

      // Action & Assert
      await expect(songsService.deleteSongById('song-456')).rejects.toThrow(NotFoundError);
    });

    it('should delete the correct song', async () => {
      // Arrange
      await arrangeSong();
      const songsService = createService();

      // Action
      await songsService.deleteSongById('song-123');
      const deletedSong = await SongsTableTestHelper.findSongsById('song-123');

      // Assert
      expect(deletedSong.length).toStrictEqual(0);
    });
  });
});
