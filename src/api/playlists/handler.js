const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(
    playlistsService,
    songsService,
    activitiesService,
    coverStorageService,
    playlistsValidator,
    uploadsValidator,
  ) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._activitiesService = activitiesService;
    this._coverStorageService = coverStorageService;
    this._playlistsValidator = playlistsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._playlistsValidator.validatePostPlaylistPayload(request.payload);
    const { name, isPublic } = request.payload;
    const { id: owner } = request.auth.credentials;

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

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);

    const mappedPlaylists = await Promise.all(playlists.map(async (playlist) => {
      const songs = await this._songsService.getSongsByPlaylist(playlist.id);
      const mappedSongs = songs.map((song) => song.id);
      return {
        ...playlist,
        songs: mappedSongs,
      };
    }));

    return {
      status: 'success',
      data: {
        playlists: mappedPlaylists,
      },
    };
  }

  async searchPlaylistsHandler(request) {
    const { name, username } = request.query;
    const playlists = await this._playlistsService.searchPlaylists(name, username);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getLikedPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
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

    const mappedPlaylists = await Promise.all(playlists.map(async (playlist) => {
      const songs = await this._songsService.getSongsByPlaylist(playlist.id);
      const mappedSongs = songs.map((song) => song.id);
      return {
        ...playlist,
        songs: mappedSongs,
      };
    }));

    return {
      status: 'success',
      data: {
        playlists: mappedPlaylists,
      },
    };
  }

  async putPlaylistByIdHandler(request) {
    this._playlistsValidator.validatePostPlaylistPayload(request.payload);
    const { name, isPublic } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.editPlaylistById({ id, name, isPublic });

    return {
      status: 'success',
      message: 'Playlist edited successfully',
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist deleted successfully',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    const { id: credentialId } = request.auth.credentials;
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

  async postSongToPlaylistHandler(request, h) {
    this._playlistsValidator.validatePostSongToPlaylistPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

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

  async getPlaylistByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials || {};

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
      const mappedLikes = likes.result.map((like) => like.id);
      return {
        ...song,
        likes: mappedLikes,
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

  async postPlaylistLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

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

  async deletePlaylistLikeHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistVisibility(id, 'public');
    await this._playlistsService.deleteLikeFromPlaylist(credentialId, id);

    return {
      status: 'success',
      message: 'Like successfully removed from playlist',
    };
  }

  async getPlaylistLikeHandler(request, h) {
    const { id } = request.params;

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

  async deleteSongFromPlaylistHandler(request) {
    this._playlistsValidator.validateDeleteSongFromPlaylistPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(id, credentialId);
    await this._songsService.deleteSongFromPlaylist(id, songId);
    await this._activitiesService.addActivity(id, songId, credentialId, 'delete');

    return {
      status: 'success',
      message: 'Song successfully removed from playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

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

module.exports = PlaylistsHandler;
