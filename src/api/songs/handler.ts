import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import {
  AddSongPayload,
  EditSongPayload,
  ISongsService,
  UploadAudioPayload,
  UploadCoverPayload,
} from '../../services/interfaces/ISongsService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IUploadsValidator } from '../../validator/uploads';
import { ISongsValidator } from '../../validator/songs';

export class SongsHandler {
  private _songsService: ISongsService;
  private _audioStorageService: IStorageService;
  private _coverStorageService: IStorageService;
  private _songsValidator: ISongsValidator;
  private _uploadsValidator: IUploadsValidator;

  constructor(
    songsService: ISongsService,
    audioStorageService: IStorageService,
    coverStorageService: IStorageService,
    songsValidator: ISongsValidator,
    uploadsValidator: IUploadsValidator,
  ) {
    this._songsService = songsService;
    this._audioStorageService = audioStorageService;
    this._coverStorageService = coverStorageService;
    this._songsValidator = songsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postSongHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as AddSongPayload;
    this._songsValidator.validateSongPayload(payload);
    const { id: credentialId } = request.auth.credentials;

    const songId = await this._songsService.addSong(payload, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Song created successfully',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request: Hapi.Request) {
    const { title, artist, genre } = request.query;
    const songs = await this._songsService.getSongs(title, artist, genre);

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
        songs: mappedSongs,
      },
    };
  }

  async getPopularSongsHandler() {
    const songs = await this._songsService.getPopularSongs();

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
        songs: mappedSongs,
      },
    };
  }

  async getLikedSongsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials;
    const songs = await this._songsService.getLikedSongs(credentialId);

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
        songs: mappedSongs,
      },
    };
  }

  async getRecentSongsHandler() {
    const songs = await this._songsService.getRecentSongs();

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getOwnedSongsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials;
    const songs = await this._songsService.getSongsByArtist(credentialId, true);

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getOwnedSinglesHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials;
    const songs = await this._songsService.getSinglesByArtist(
      credentialId,
      true,
    );

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request: Hapi.Request) {
    const { id } = request.params;
    const song = await this._songsService.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request: Hapi.Request) {
    const payload = request.payload as EditSongPayload;
    this._songsValidator.validateSongPayload(payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.verifySongArtist(id, credentialId);
    await this._songsService.editSongById(id, payload);

    return {
      status: 'success',
      message: 'Song edited successfully',
    };
  }

  async deleteSongByIdHandler(request: Hapi.Request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.verifySongArtist(id, credentialId);
    await this._songsService.deleteSongById(id);

    return {
      status: 'success',
      message: 'Song deleted successfully',
    };
  }

  async postSongLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.getSongById(id);
    await this._songsService.addLikeToSong(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Like successfully added to song',
    });

    response.code(201);
    return response;
  }

  async deleteSongLikeHandler(request: Hapi.Request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.deleteLikeFromSong(credentialId, id);

    return {
      status: 'success',
      message: 'Like successfully removed from song',
    };
  }

  async getSongLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;

    const likes = await this._songsService.getSongLikes(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: likes.result.length,
      },
    });

    return response;
  }

  async postUploadAudioHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;
    const { audio } = request.payload as UploadAudioPayload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateAudioHeaders(audio.hapi.headers);

    await this._songsService.getSongById(id);
    await this._songsService.verifySongArtist(id, credentialId);

    const fileLocation = await this._audioStorageService.writeFile(
      audio,
      audio.hapi,
    );

    await this._songsService.addAudioToSong(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Audio added successfully',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }

  async postUploadCoverHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params;
    const { cover } = request.payload as UploadCoverPayload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    await this._songsService.getSongById(id);
    await this._songsService.verifySongArtist(id, credentialId);

    const fileLocation = await this._coverStorageService.writeFile(
      cover,
      cover.hapi,
    );

    await this._songsService.addCoverToSong(id, fileLocation);

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
