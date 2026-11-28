import { nanoid } from 'nanoid';
import { Prisma, PrismaClient } from '../../generated/prisma';
import {
  AddPlaylistPayload,
  EditPlaylistPayload,
  IPlaylistsService,
  Playlist,
  PlaylistCollaborator,
  PlaylistDetail,
  PlaylistLikesResult,
  PlaylistVisibility,
} from '../interfaces/IPlaylistsService';
import { ICacheService } from '../interfaces/ICacheService';
import { ICollaborationsService } from '../interfaces/ICollaborationsService';
import { AuthorizationError } from '../../exceptions/AuthorizationError';
import { InvariantError } from '../../exceptions/InvariantError';
import { NotFoundError } from '../../exceptions/NotFoundError';

// Equivalent of `SELECT playlists.*, users.username ... LEFT JOIN users`.
const playlistSelect = {
  id: true,
  name: true,
  owner: true,
  created_at: true,
  updated_at: true,
  cover: true,
  is_public: true,
  users: { select: { username: true } },
} satisfies Prisma.playlistsSelect;

type PlaylistRow = Prisma.playlistsGetPayload<{ select: typeof playlistSelect }>;

// Handlers spread these rows straight into responses, so keep the flat
// snake_case shape the old raw SQL returned.
const toPlaylist = ({ users, ...playlist }: PlaylistRow): Playlist => ({
  ...playlist,
  username: users.username,
});

const likesCacheKey = (playlistId: string) => `playlist:${playlistId}`;

export class PostgresPlaylistsService implements IPlaylistsService {
  private _prisma: PrismaClient;
  private _collaborationsService: ICollaborationsService;
  private _cacheService: ICacheService;

  constructor(
    prisma: PrismaClient,
    collaborationsService: ICollaborationsService,
    cacheService: ICacheService,
  ) {
    this._prisma = prisma;
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist({ name, owner, isPublic }: AddPlaylistPayload): Promise<string> {
    const now = new Date();

    try {
      const playlist = await this._prisma.playlists.create({
        data: {
          id: `playlist-${nanoid(16)}`,
          name,
          owner,
          created_at: now,
          updated_at: now,
          cover: null,
          is_public: isPublic,
        },
        select: { id: true },
      });

      return playlist.id;
    } catch {
      throw new InvariantError('Failed to create playlist');
    }
  }

  async editPlaylistById({ id, name, isPublic }: EditPlaylistPayload): Promise<void> {
    const { count } = await this._prisma.playlists.updateMany({
      where: { id },
      data: { name, is_public: isPublic, updated_at: new Date() },
    });

    if (!count) {
      throw new NotFoundError('Failed to edit playlist. Id not found');
    }
  }

  async getPlaylists(owner: string): Promise<Playlist[]> {
    const playlists = await this._prisma.playlists.findMany({
      where: {
        OR: [
          { owner },
          { collaborations: { some: { user_id: owner } } },
        ],
      },
      select: playlistSelect,
    });

    return playlists.map(toPlaylist);
  }

  async searchPlaylists(name?: string, username?: string): Promise<Playlist[]> {
    const searchConditions: Prisma.playlistsWhereInput[] = [];

    if (name !== undefined) {
      searchConditions.push({ name: { contains: name, mode: 'insensitive' } });
    }

    if (username !== undefined) {
      searchConditions.push({
        users: { username: { contains: username, mode: 'insensitive' } },
      });
    }

    const playlists = await this._prisma.playlists.findMany({
      where: {
        is_public: true,
        users: { is_banned: false },
        ...(searchConditions.length ? { OR: searchConditions } : {}),
      },
      select: playlistSelect,
      take: 20,
    });

    return playlists.map(toPlaylist);
  }

  async getPopularPlaylists(): Promise<Playlist[]> {
    const playlists = await this._prisma.playlists.findMany({
      where: { is_public: true },
      select: playlistSelect,
    });

    return playlists.map(toPlaylist);
  }

  async getLikedPlaylists(userId: string): Promise<Playlist[]> {
    const playlists = await this._prisma.playlists.findMany({
      where: {
        is_public: true,
        user_playlist_likes: { some: { user_id: userId } },
      },
      select: playlistSelect,
    });

    return playlists.map(toPlaylist);
  }

  async getPlaylistById(id: string): Promise<PlaylistDetail> {
    const playlist = await this._prisma.playlists.findUnique({
      where: { id },
      select: playlistSelect,
    });

    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }

    return { ...toPlaylist(playlist), owner_id: playlist.owner };
  }

  async getPlaylistCollaborators(id: string): Promise<PlaylistCollaborator[]> {
    return this._prisma.users.findMany({
      where: { collaborations: { some: { playlist_id: id } } },
      select: { id: true, username: true },
    });
  }

  async deletePlaylistById(id: string): Promise<void> {
    const { count } = await this._prisma.playlists.deleteMany({ where: { id } });

    if (!count) {
      throw new NotFoundError('Failed to delete playlist. Id not found');
    }
  }

  async addCoverToPlaylist(id: string, fileLocation: string): Promise<void> {
    await this._prisma.playlists.updateMany({
      where: { id },
      data: { cover: fileLocation, updated_at: new Date() },
    });
  }

  async addLikeToPlaylist(userId: string, playlistId: string): Promise<void> {
    if (await this.verifyPlaylistLikes(userId, playlistId)) {
      throw new InvariantError('Failed to like playlist');
    }

    await this._prisma.user_playlist_likes.create({
      data: {
        id: `like_playlist-${nanoid(16)}`,
        user_id: userId,
        playlist_id: playlistId,
      },
    });

    await this._cacheService.delete(likesCacheKey(playlistId));
  }

  async deleteLikeFromPlaylist(userId: string, playlistId: string): Promise<void> {
    const { count } = await this._prisma.user_playlist_likes.deleteMany({
      where: { user_id: userId, playlist_id: playlistId },
    });

    if (!count) {
      throw new InvariantError('Failed to unlike playlist');
    }

    await this._cacheService.delete(likesCacheKey(playlistId));
  }

  async getPlaylistLikes(id: string): Promise<PlaylistLikesResult> {
    try {
      const cached = await this._cacheService.get(likesCacheKey(id));
      return { cache: true, result: JSON.parse(cached) };
    } catch {
      const likes = await this._prisma.user_playlist_likes.findMany({
        where: { playlist_id: id },
        select: { user_id: true },
      });
      const result = likes.map(({ user_id: userId }) => ({ id: userId }));

      await this._cacheService.set(likesCacheKey(id), JSON.stringify(result));

      return { cache: false, result };
    }
  }

  async verifyPlaylistLikes(userId: string, playlistId: string): Promise<boolean> {
    const like = await this._prisma.user_playlist_likes.findUnique({
      where: { user_id_playlist_id: { user_id: userId, playlist_id: playlistId } },
      select: { id: true },
    });

    return like !== null;
  }

  async verifyPlaylistVisibility(
    playlistId: string,
    type: PlaylistVisibility = 'private',
  ): Promise<void> {
    const playlist = await this._prisma.playlists.findUnique({
      where: { id: playlistId },
      select: { is_public: true },
    });

    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }

    if (type === 'public' && !playlist.is_public) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }

    if (type === 'private' && playlist.is_public) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  }

  async verifyPlaylistOwner(id: string, owner: string | undefined): Promise<void> {
    const playlist = await this._prisma.playlists.findUnique({
      where: { id },
      select: { owner: true },
    });

    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }

    if (playlist.owner !== owner) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  }

  async verifyPlaylistAccess(playlistId: string, userId: string | undefined): Promise<void> {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Unauthenticated callers can never be collaborators. Bail out before the
      // lookup so an undefined id can't turn into a "match anything" filter.
      if (!userId) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}
