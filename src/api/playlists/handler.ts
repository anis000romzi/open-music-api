import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import {
  IPlaylistsService,
  Playlist,
  PlaylistPayload,
  PlaylistSongPayload,
  UploadCoverPayload,
} from '../../services/interfaces/IPlaylistsService';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IActivitiesService } from '../../services/interfaces/IActivitiesService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IPlaylistsValidator } from '../../validator/playlists';
import { IUploadsValidator } from '../../validator/uploads';

type IdParams = { id: string };
type Credentials = { id: string };

export class PlaylistsHandler {
  private _playlistsService: IPlaylistsService;
  private _songsService: ISongsService;
  private _activitiesService: IActivitiesService;
  private _coverStorageService: IStorageService;
  private _playlistsValidator: IPlaylistsValidator;
  private _uploadsValidator: IUploadsValidator;

  constructor(
    playlistsService: IPlaylistsService,
    songsService: ISongsService,
    activitiesService: IActivitiesService,
    coverStorageService: IStorageService,
    playlistsValidator: IPlaylistsValidator,
    uploadsValidator: IUploadsValidator,
  ) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._activitiesService = activitiesService;
    this._coverStorageService = coverStorageService;
    this._playlistsValidator = playlistsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  private async withSongIds(playlists: Playlist[]) {
    return Promise.all(playlists.map(async (playlist) => {
      const songs = await this._songsService.getSongsByPlaylist(playlist.id);
      return {
        ...playlist,
        songs: songs.map((song) => song.id),
      };
    }));
  }

  async postPlaylistHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as PlaylistPayload;
    this._playlistsValidator.validatePostPlaylistPayload(payload);
    const { name, isPublic } = payload;
    const { id: owner } = request.auth.credentials as Credentials;

    const playlistId = await this._playlistsService.addPlaylist({ name, owner, isPublic });

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials as Credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists: await this.withSongIds(playlists),
      },
    };
  }

  async searchPlaylistsHandler(request: Hapi.Request) {
    const { name, username } = request.query as { name?: string; username?: string };
    const playlists = await this._playlistsService.searchPlaylists(name, username);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getLikedPlaylistsHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials as Credentials;
    const playlists = await this._playlistsService.getLikedPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getPopularPlaylistsHandler() {
    const playlists = await this._playlistsService.getPopularPlaylists();

    return {
      status: 'success',
      data: {
        playlists: await this.withSongIds(playlists),
      },
    };
  }

  async putPlaylistByIdHandler(request: Hapi.Request) {
    const payload = request.payload as PlaylistPayload;
    this._playlistsValidator.validatePostPlaylistPayload(payload);
    const { name, isPublic } = payload;
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.editPlaylistById({ id, name, isPublic });

    return {
      status: 'success',
      message: 'Playlist edited successfully',
    };
  }

  async deletePlaylistByIdHandler(request: Hapi.Request) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist deleted successfully',
    };
  }

  async postUploadCoverHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;
    const { cover } = request.payload as UploadCoverPayload;
    const { id: credentialId } = request.auth.credentials as Credentials;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    await this._playlistsService.verifyPlaylistOwner(id, credentialId);

    const fileLocation = await this._coverStorageService.writeFile(cover, cover.hapi);

    await this._playlistsService.addCoverToPlaylist(id, fileLocation);

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

  async postSongToPlaylistHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as PlaylistSongPayload;
    this._playlistsValidator.validatePostSongToPlaylistPayload(payload);
    const { id } = request.params as IdParams;
    const { songId } = payload;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistAccess(id, credentialId);
    await this._songsService.getSongById(songId);
    await this._songsService.addSongToPlaylist(id, songId);
    await this._activitiesService.addActivity(id, songId, credentialId, 'add');

    const response = h.response({
      status: 'success',
      message: 'Song created successfully',
    });
    response.code(201);
    return response;
  }

  async getPlaylistByIdHandler(request: Hapi.Request) {
    const { id: playlistId } = request.params as IdParams;
    // Route uses optional auth, so credentials may be missing.
    const credentialId = (request.auth.credentials as Credentials | null)?.id;

    const {
      id,
      name,
      username,
      owner_id: ownerId,
      cover,
      is_public: isPublic,
    } = await this._playlistsService.getPlaylistById(playlistId);

    if (!isPublic) {
      await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    }

    const collaborators = await this._playlistsService.getPlaylistCollaborators(playlistId);
    const songs = await this._songsService.getSongsByPlaylist(playlistId);
    const playlistLikes = await this._playlistsService.getPlaylistLikes(playlistId);
    const mappedPlaylistLikes = playlistLikes.result.map((like) => like.id);

    const mappedSongs = await Promise.all(songs.map(async (song) => {
      const likes = await this._songsService.getSongLikes(song.id);
      return {
        ...song,
        likes: likes.result.map((like) => like.id),
      };
    }));

    return {
      status: 'success',
      data: {
        playlist: {
          id,
          name,
          username,
          ownerId,
          cover,
          is_public: isPublic,
          collaborators,
          likes: mappedPlaylistLikes,
          songs: mappedSongs,
        },
      },
    };
  }

  async postPlaylistLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.getPlaylistById(id);
    await this._playlistsService.verifyPlaylistVisibility(id, 'public');
    await this._playlistsService.addLikeToPlaylist(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Like successfully added to playlist',
    });

    response.code(201);
    return response;
  }

  async deletePlaylistLikeHandler(request: Hapi.Request) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistVisibility(id, 'public');
    await this._playlistsService.deleteLikeFromPlaylist(credentialId, id);

    return {
      status: 'success',
      message: 'Like successfully removed from playlist',
    };
  }

  async getPlaylistLikeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;

    const likes = await this._playlistsService.getPlaylistLikes(id);

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

  async deleteSongFromPlaylistHandler(request: Hapi.Request) {
    const payload = request.payload as PlaylistSongPayload;
    this._playlistsValidator.validateDeleteSongFromPlaylistPayload(payload);
    const { id } = request.params as IdParams;
    const { songId } = payload;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistAccess(id, credentialId);
    await this._songsService.deleteSongFromPlaylist(id, songId);
    await this._activitiesService.addActivity(id, songId, credentialId, 'delete');

    return {
      status: 'success',
      message: 'Song successfully removed from playlist',
    };
  }

  async getPlaylistActivitiesHandler(request: Hapi.Request) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._playlistsService.verifyPlaylistAccess(id, credentialId);
    const activities = await this._activitiesService.getActivities(id);

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }
}
