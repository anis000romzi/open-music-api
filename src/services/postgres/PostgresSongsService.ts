import { nanoid } from 'nanoid';
import { Prisma, PrismaClient } from '../../generated/prisma';
import { ICacheService } from '../interfaces/ICacheService';
import {
  ISongsService,
  AddSongPayload,
  EditSongPayload,
  Song,
  SongDetail,
  PopularSong,
  RecentSong,
  SongLikesResult,
} from '../interfaces/ISongsService';
import { InvariantError } from '../../exceptions/InvariantError';
import { NotFoundError } from '../../exceptions/NotFoundError';
import { AuthorizationError } from '../../exceptions/AuthorizationError';

export class PostgresSongsService implements ISongsService {
  private _prisma: PrismaClient;
  private _cacheService: ICacheService;

  constructor(prisma: PrismaClient, cacheService: ICacheService) {
    this._prisma = prisma;
    this._cacheService = cacheService;
  }

  async addSong(
    {
      title, year, genre, duration, albumId,
    }: AddSongPayload,
    artist: string,
  ): Promise<string> {
    const id = `song-${nanoid(16)}`;
    const now = new Date();

    try {
      const song = await this._prisma.songs.create({
        data: {
          id,
          title,
          year,
          genre,
          artist,
          duration,
          album_id: albumId ?? null,
          audio: null,
          cover: null,
          created_at: now,
          updated_at: now,
        },
        select: { id: true },
      });
      return song.id;
    } catch {
      throw new InvariantError('Failed to create song');
    }
  }

  async editSongById(
    id: string,
    {
      title, year, genre, duration, albumId,
    }: EditSongPayload,
  ): Promise<void> {
    try {
      await this._prisma.songs.update({
        where: { id },
        data: {
          title,
          year,
          genre,
          duration,
          album_id: albumId ?? null,
          updated_at: new Date(),
        },
      });
    } catch {
      throw new NotFoundError('Failed to edit song. Id not found');
    }
  }

  async deleteSongById(id: string): Promise<void> {
    try {
      await this._prisma.songs.delete({ where: { id } });
    } catch {
      throw new NotFoundError('Failed to delete song. Id not found');
    }
  }

  async addAudioToSong(id: string, fileLocation: string): Promise<void> {
    await this._prisma.songs.update({
      where: { id },
      data: { audio: fileLocation, updated_at: new Date() },
    });
  }

  async addCoverToSong(id: string, fileLocation: string): Promise<void> {
    await this._prisma.songs.update({
      where: { id },
      data: { cover: fileLocation, updated_at: new Date() },
    });
  }

  async addListenedCountToSong(id: string): Promise<void> {
    await this._prisma.songs.update({
      where: { id },
      data: { listened: { increment: 1 } },
    });
  }

  async getSongs(
    title?: string,
    artist?: string,
    genre?: string,
  ): Promise<Song[]> {
    const searchConditions: Prisma.songsWhereInput[] = [];

    if (title !== undefined) {
      searchConditions.push({
        title: { contains: title, mode: 'insensitive' },
      });
    }
    if (artist !== undefined) {
      searchConditions.push({
        users: { fullname: { contains: artist, mode: 'insensitive' } },
      });
    }
    if (genre !== undefined) {
      searchConditions.push({
        genres: { name: { contains: genre, mode: 'insensitive' } },
      });
    }

    const songs = await this._prisma.songs.findMany({
      where: {
        AND: [
          { is_removed: false },
          { users: { is_banned: false } },
          ...(searchConditions.length > 1
            ? [{ OR: searchConditions }]
            : searchConditions),
        ],
      },
      select: {
        id: true,
        title: true,
        artist: true,
        listened: true,
        audio: true,
        cover: true,
        duration: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        genres: { select: { name: true } },
      },
      take: 20,
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      artist_id: song.artist,
      artist: song.users?.fullname ?? null,
      genre: song.genres?.name ?? null,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
      duration: song.duration,
    }));
  }

  async getSongById(id: string): Promise<SongDetail> {
    const song = await this._prisma.songs.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        year: true,
        artist: true,
        genre: true,
        duration: true,
        audio: true,
        cover: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        genres: { select: { name: true } },
      },
    });

    if (!song) throw new NotFoundError('Song not found');

    return {
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      year: song.year,
      artist: song.users?.fullname ?? null,
      artist_id: song.artist,
      genre: song.genres?.name ?? null,
      genre_id: song.genre,
      duration: song.duration,
      listened: null,
      audio: song.audio,
      cover: song.cover,
    };
  }

  async getPopularSongs(): Promise<PopularSong[]> {
    const songs = await this._prisma.songs.findMany({
      select: {
        id: true,
        title: true,
        artist: true,
        listened: true,
        audio: true,
        cover: true,
        duration: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        _count: { select: { user_song_likes: true } },
      },
      orderBy: [{ user_song_likes: { _count: 'desc' } }, { listened: 'desc' }],
      take: 20,
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      artist_id: song.artist,
      artist: song.users?.fullname ?? null,
      genre: null,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
      duration: song.duration,
      likes: song._count.user_song_likes,
    }));
  }

  async getLikedSongs(userId: string): Promise<Song[]> {
    const songs = await this._prisma.songs.findMany({
      where: {
        is_removed: false,
        user_song_likes: { some: { user_id: userId } },
      },
      select: {
        id: true,
        title: true,
        artist: true,
        listened: true,
        audio: true,
        cover: true,
        duration: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
      },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      artist_id: song.artist,
      artist: song.users?.fullname ?? null,
      genre: null,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
      duration: song.duration,
    }));
  }

  async getRecentSongs(): Promise<RecentSong[]> {
    const songs = await this._prisma.songs.findMany({
      select: {
        id: true,
        title: true,
        audio: true,
        albums: { select: { name: true } },
        users: { select: { username: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      artist: song.users?.username ?? null,
      audio: song.audio,
    }));
  }

  async getSongsByAlbum(id: string): Promise<SongDetail[]> {
    const songs = await this._prisma.songs.findMany({
      where: { album_id: id, is_removed: false, users: { is_banned: false } },
      select: {
        id: true,
        title: true,
        year: true,
        artist: true,
        genre: true,
        duration: true,
        listened: true,
        audio: true,
        cover: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        genres: { select: { name: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      year: song.year,
      artist: song.users?.fullname ?? null,
      artist_id: song.artist,
      genre: song.genres?.name ?? null,
      genre_id: song.genre,
      duration: song.duration,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
    }));
  }

  async getSongsByArtist(
    artistId: string,
    owned: boolean = false,
  ): Promise<SongDetail[]> {
    const songs = await this._prisma.songs.findMany({
      where: {
        artist: artistId,
        ...(owned ? {} : { is_removed: false, users: { is_banned: false } }),
      },
      select: {
        id: true,
        title: true,
        year: true,
        album_id: true,
        artist: true,
        genre: true,
        duration: true,
        listened: true,
        audio: true,
        cover: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        genres: { select: { name: true } },
      },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      album_id: song.album_id,
      year: song.year,
      artist: song.users?.fullname ?? null,
      artist_id: song.artist,
      genre: song.genres?.name ?? null,
      genre_id: song.genre,
      duration: song.duration,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
    }));
  }

  async getSinglesByArtist(
    artistId: string,
    owned: boolean = false,
  ): Promise<SongDetail[]> {
    const songs = await this._prisma.songs.findMany({
      where: {
        artist: artistId,
        album_id: null,
        ...(owned ? {} : { is_removed: false, users: { is_banned: false } }),
      },
      select: {
        id: true,
        title: true,
        year: true,
        artist: true,
        genre: true,
        duration: true,
        listened: true,
        audio: true,
        cover: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
        genres: { select: { name: true } },
      },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      year: song.year,
      artist: song.users?.fullname ?? null,
      artist_id: song.artist,
      genre: song.genres?.name ?? null,
      genre_id: song.genre,
      duration: song.duration,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
    }));
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<string> {
    try {
      const result = await this._prisma.playlist_songs.create({
        data: {
          id: `playlist_song-${nanoid(16)}`,
          playlist_id: playlistId,
          song_id: songId,
        },
        select: { id: true },
      });
      return result.id;
    } catch {
      throw new InvariantError('Failed to add song to a playlist');
    }
  }

  async getSongsByPlaylist(id: string): Promise<Song[]> {
    const songs = await this._prisma.songs.findMany({
      where: {
        is_removed: false,
        users: { is_banned: false },
        playlist_songs: { some: { playlist_id: id } },
      },
      select: {
        id: true,
        title: true,
        artist: true,
        listened: true,
        audio: true,
        cover: true,
        duration: true,
        albums: { select: { name: true } },
        users: { select: { fullname: true } },
      },
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albums?.name ?? null,
      artist_id: song.artist,
      artist: song.users?.fullname ?? null,
      genre: null,
      listened: song.listened,
      audio: song.audio,
      cover: song.cover,
      duration: song.duration,
    }));
  }

  async deleteSongFromPlaylist(
    playlistId: string,
    songId: string,
  ): Promise<void> {
    const result = await this._prisma.playlist_songs.deleteMany({
      where: { playlist_id: playlistId, song_id: songId },
    });

    if (result.count === 0) throw new InvariantError('Failed to delete song from playlist');
  }

  async addSongToAlbum(albumId: string, songId: string): Promise<string> {
    try {
      const song = await this._prisma.songs.update({
        where: { id: songId },
        data: { album_id: albumId, updated_at: new Date() },
        select: { id: true },
      });
      return song.id;
    } catch {
      throw new InvariantError('Failed to add song to album');
    }
  }

  async verifySongArtist(id: string, artist: string): Promise<void> {
    const song = await this._prisma.songs.findUnique({
      where: { id },
      select: { artist: true },
    });

    if (!song) throw new NotFoundError('Song not found');
    if (song.artist !== artist) {
      throw new AuthorizationError(
        'You are not authorized to access this resource',
      );
    }
  }

  private async verifySongLikes(userId: string, songId: string) {
    return this._prisma.user_song_likes.findFirst({
      where: { user_id: userId, song_id: songId },
    });
  }

  async addLikeToSong(userId: string, songId: string): Promise<void> {
    const existing = await this.verifySongLikes(userId, songId);
    if (existing) throw new InvariantError('Failed to like song');

    await this._prisma.user_song_likes.create({
      data: { id: `like_song-${nanoid(16)}`, user_id: userId, song_id: songId },
    });

    await this._cacheService.delete(`song:${songId}`);
  }

  async deleteLikeFromSong(userId: string, songId: string): Promise<void> {
    const result = await this._prisma.user_song_likes.deleteMany({
      where: { user_id: userId, song_id: songId },
    });

    if (result.count === 0) throw new InvariantError('Failed to unlike song');

    await this._cacheService.delete(`song:${songId}`);
  }

  async getSongLikes(id: string): Promise<SongLikesResult> {
    try {
      const cached = await this._cacheService.get(`song:${id}`);
      return { cache: true, result: JSON.parse(cached) };
    } catch {
      const likes = await this._prisma.user_song_likes.findMany({
        where: { song_id: id },
        select: { users: { select: { id: true } } },
      });

      const rows = likes.map((like) => ({ id: like.users.id }));
      await this._cacheService.set(`song:${id}`, JSON.stringify(rows));

      return { cache: false, result: rows };
    }
  }
}
