import { nanoid } from 'nanoid';
import { Prisma, PrismaClient } from '../../generated/prisma';
import {
  IAlbumsService,
  AddAlbumPayload,
  Album,
  PopularAlbum,
  EditAlbumPayload,
  AlbumLikesResult,
} from '../interfaces/IAlbumsService';
import { ICacheService } from '../interfaces/ICacheService';
import { AuthorizationError } from '../../exceptions/AuthorizationError';
import { InvariantError } from '../../exceptions/InvariantError';
import { NotFoundError } from '../../exceptions/NotFoundError';

export class PostgresAlbumsService implements IAlbumsService {
  private _prisma: PrismaClient;
  private _cacheService: ICacheService;

  constructor(prisma: PrismaClient, cacheService: ICacheService) {
    this._prisma = prisma;
    this._cacheService = cacheService;
  }

  async addAlbum(
    { name, year }: AddAlbumPayload,
    artist: string,
  ): Promise<string> {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date();

    try {
      const album = await this._prisma.albums.create({
        data: {
          id,
          name,
          year,
          artist,
          cover: null,
          created_at: createdAt,
          updated_at: createdAt,
        },
        select: { id: true },
      });

      return album.id;
    } catch (error) {
      console.error(error);
      throw new InvariantError('Failed to create album');
    }
  }

  async getAlbums(name?: string, artist?: string): Promise<Album[]> {
    const searchConditions: Prisma.albumsWhereInput[] = [];

    if (name !== undefined) {
      searchConditions.push({
        name: { contains: name, mode: 'insensitive' },
      });
    }

    if (artist !== undefined) {
      searchConditions.push({
        users: { fullname: { contains: artist, mode: 'insensitive' } },
      });
    }

    const albums = await this._prisma.albums.findMany({
      where: {
        AND: [
          { users: { is_banned: false } },
          ...(searchConditions.length > 1
            ? [{ OR: searchConditions }]
            : searchConditions),
        ],
      },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: { select: { fullname: true } },
      },
      take: 20,
    });

    return albums.map((album) => ({
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
    }));
  }

  async getAlbumById(albumId: string): Promise<Album> {
    const album = await this._prisma.albums.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: {
          select: { fullname: true },
        },
      },
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    return {
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
    };
  }

  async getAlbumsByArtist(artistId: string): Promise<Album> {
    const album = await this._prisma.albums.findFirst({
      where: { artist: artistId },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: {
          select: { fullname: true },
        },
      },
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    return {
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
    };
  }

  async getPopularAlbums(): Promise<PopularAlbum[]> {
    const albums = await this._prisma.albums.findMany({
      where: {
        users: { is_banned: false },
      },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: {
          select: { fullname: true },
        },
        _count: {
          select: { user_album_likes: true },
        },
      },
      orderBy: {
        user_album_likes: { _count: 'desc' },
      },
      take: 20,
    });

    return albums.map((album) => ({
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
      likes: album._count.user_album_likes,
    }));
  }

  async getLikedAlbums(userId: string): Promise<Album[]> {
    const albums = await this._prisma.albums.findMany({
      where: {
        user_album_likes: {
          some: { user_id: userId },
        },
      },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: {
          select: { fullname: true },
        },
      },
    });

    return albums.map((album) => ({
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
    }));
  }

  async editAlbumById(
    id: string,
    { name, year }: EditAlbumPayload,
  ): Promise<Album> {
    const updatedAt = new Date().toISOString();

    try {
      const album = await this._prisma.albums.update({
        where: {
          id,
        },
        data: {
          name,
          year,
          updated_at: updatedAt,
        },
        select: {
          id: true,
          name: true,
          year: true,
          artist: true,
          cover: true,
          users: {
            select: { fullname: true },
          },
        },
      });

      return {
        id: album.id,
        name: album.name,
        year: album.year,
        artist_id: album.artist,
        artist: album.users?.fullname ?? null,
        cover: album.cover,
      };
    } catch (error) {
      console.error(error);
      throw new InvariantError('Failed to update album');
    }
  }

  async addCoverToAlbum(id: string, fileLocation: string): Promise<Album> {
    const updatedAt = new Date().toISOString();

    try {
      const album = await this._prisma.albums.update({
        where: {
          id,
        },
        data: {
          cover: fileLocation,
          updated_at: updatedAt,
        },
        select: {
          id: true,
          name: true,
          year: true,
          artist: true,
          cover: true,
          users: {
            select: { fullname: true },
          },
        },
      });

      return {
        id: album.id,
        name: album.name,
        year: album.year,
        artist_id: album.artist,
        artist: album.users?.fullname ?? null,
        cover: album.cover,
      };
    } catch (error) {
      console.error(error);
      throw new InvariantError('Failed to create album');
    }
  }

  async deleteAlbumById(id: string): Promise<string> {
    try {
      const result = await this._prisma.albums.delete({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

      return result.id;
    } catch (error) {
      console.error(error);
      throw new InvariantError('Failed to delete album');
    }
  }

  async verifyAlbumArtist(id: string, artist: string): Promise<Album> {
    const album = await this._prisma.albums.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        year: true,
        artist: true,
        cover: true,
        users: {
          select: { fullname: true },
        },
      },
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    if (album.artist !== artist) {
      throw new AuthorizationError(
        'You are not authorized to access this resource',
      );
    }

    return {
      id: album.id,
      name: album.name,
      year: album.year,
      artist_id: album.artist,
      artist: album.users?.fullname ?? null,
      cover: album.cover,
    };
  }

  async addLikeToAlbum(userId: string, albumId: string): Promise<void> {
    const existingLike = await this.verifyAlbumLikes(userId, albumId);

    if (existingLike) {
      throw new InvariantError('Failed to like album');
    }

    await this._prisma.user_album_likes.create({
      data: {
        id: `like_album-${nanoid(16)}`,
        user_id: userId,
        album_id: albumId,
      },
    });

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async deleteLikeFromAlbum(userId: string, albumId: string): Promise<void> {
    const existingLike = await this.verifyAlbumLikes(userId, albumId);

    if (!existingLike) {
      throw new InvariantError('Failed to unlike album');
    }

    await this._prisma.user_album_likes.delete({
      where: {
        user_id_album_id: { user_id: userId, album_id: albumId },
      },
    });

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async getAlbumLikes(id: string): Promise<AlbumLikesResult> {
    try {
      const cached = await this._cacheService.get(`albums:${id}`);
      return {
        cache: true,
        result: JSON.parse(cached),
      };
    } catch {
      const likes = await this._prisma.user_album_likes.findMany({
        where: { album_id: id },
        select: {
          users: { select: { id: true } },
        },
      });

      const rows = likes.map((like) => ({ id: like.users.id }));

      await this._cacheService.set(`albums:${id}`, JSON.stringify(rows));

      return {
        cache: false,
        result: rows,
      };
    }
  }

  private async verifyAlbumLikes(userId: string, albumId: string) {
    return this._prisma.user_album_likes.findUnique({
      where: {
        user_id_album_id: { user_id: userId, album_id: albumId },
      },
    });
  }
}
