import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import { AddAlbumPayload, IAlbumsService, UploadCoverPayload } from '../../services/interfaces/IAlbumsService';
import { IAlbumsValidator } from '../../validator/albums/index';
import { IUploadsValidator } from '../../validator/uploads';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { ISongsService } from '../../services/interfaces/ISongsService';

export class AlbumsHandler {
  private _albumsService: IAlbumsService;
  private _songsService: ISongsService;
  private _storageService: IStorageService;
  private _albumsValidator: IAlbumsValidator;
  private _uploadsValidator: IUploadsValidator;

  constructor(
    albumsService: IAlbumsService,
    songsService: ISongsService,
    storageService: IStorageService,
    albumsValidator: IAlbumsValidator,
    uploadsValidator: IUploadsValidator,
  ) {
    this._albumsService = albumsService;
    this._songsService = songsService;
    this._storageService = storageService;
    this._albumsValidator = albumsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as AddAlbumPayload;
    this._albumsValidator.validateAlbumPayload(payload);
    const { id: credentialId } = request.auth.credentials;

    const albumId = await this._albumsService.addAlbum(
      payload,
      credentialId,
    );

    const response = h.response({
      status: 'success',
      message: 'Album created successfully',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler(request: Hapi.Request) {
    const { name, artist } = request.query;
    const albums = await this._albumsService.getAlbums(name, artist);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request: Hapi.Request) {
    const { id } = request.params;
    const {
      id: albumId,
      name,
      year,
      artist_id: artistId,
      artist,
      cover: coverUrl,
    } = await this._albumsService.getAlbumById(id);

    const albumLikes = await this._albumsService.getAlbumLikes(id);
    const mappedAlbumLikes = albumLikes.result.map((like) => like.id);

    const songs = await this._songsService.getSongsByAlbum(id);
    const mappedSongs = await Promise.all(
      songs.map(async (song) => {
        const likes = await this._songsService.getSongLikes(song.id);
        const mappedLikes = likes.result.map((like) => like.id);

        return {
          ...song,
          likes: mappedLikes,
        };
      }),
    );

    return {
      status: 'success',
      data: {
        album: {
          id: albumId,
          name,
          year,
          artistId,
          artist,
          coverUrl,
          likes: mappedAlbumLikes,
          songs: mappedSongs,
        },
      },
    };
  }

  async getAlbumsByArtistHandler(request: Hapi.Request) {
    const { id } = request.params;
    const albums = await this._albumsService.getAlbumsByArtist(id);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getOwnedAlbumsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials;
    const albums = await this._albumsService.getAlbumsByArtist(credentialId);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getLikedAlbumsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials;
    const albums = await this._albumsService.getLikedAlbums(credentialId);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getPopularAlbumsHandler() {
    const albums = await this._albumsService.getPopularAlbums();

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async putAlbumByIdHandler(request: Hapi.Request) {
    const payload = request.payload as AddAlbumPayload;
    this._albumsValidator.validateAlbumPayload(payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.verifyAlbumArtist(id, credentialId);
    await this._albumsService.editAlbumById(id, payload);

    return {
      status: 'success',
      message: 'Album edited successfully',
    };
  }

  async deleteAlbumByIdHandler(request: Hapi.Request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.verifyAlbumArtist(id, credentialId);
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album deleted successfully',
    };
  }

  async postAlbumLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);
    await this._albumsService.addLikeToAlbum(credentialId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Like successfully added to album',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request: Hapi.Request) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.deleteLikeFromAlbum(credentialId, albumId);

    return {
      status: 'success',
      message: 'Like successfully removed from album',
    };
  }

  async getAlbumLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;

    const likes = await this._albumsService.getAlbumLikes(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: likes.result.length,
      },
    });

    if (likes.cache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }

  async postUploadCoverHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;
    const { cover } = request.payload as UploadCoverPayload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    await this._albumsService.getAlbumById(id);
    await this._albumsService.verifyAlbumArtist(id, credentialId);

    const fileLocation = await this._storageService.writeFile(
      cover,
      cover.hapi,
    );

    await this._albumsService.addCoverToAlbum(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Cover added successfully',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }
}
