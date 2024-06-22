const autoBind = require('auto-bind');

class SongsHandler {
  constructor(
    songsService,
    audioStorageService,
    coverStorageService,
    songsValidator,
    uploadsValidator,
  ) {
    this._songsService = songsService;
    this._audioStorageService = audioStorageService;
    this._coverStorageService = coverStorageService;
    this._songsValidator = songsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    this._songsValidator.validateSongPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;

    const songId = await this._songsService.addSong(request.payload, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
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

  async getFavoriteSongsHandler() {
    const songs = await this._songsService.getFavoriteSongs();

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getLikedSongsHandler(request) {
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

  async getOwnedSongsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const songs = await this._songsService.getSongsByArtist(credentialId);

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getOwnedSinglesHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const songs = await this._songsService.getSinglesByArtist(credentialId);

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._songsService.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    this._songsValidator.validateSongPayload(request.payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.verifySongArtist(id, credentialId);
    await this._songsService.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.verifySongArtist(id, credentialId);
    await this._songsService.deleteSongById(id);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }

  async postSongLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.getSongById(id);
    await this._songsService.addLikeToSong(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Like berhasil ditambahkan ke lagu',
    });

    response.code(201);
    return response;
  }

  async deleteSongLikeHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._songsService.deleteLikeFromSong(credentialId, id);

    return {
      status: 'success',
      message: 'Like berhasil dihapus dari lagu',
    };
  }

  async getSongLikeHandler(request, h) {
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

  async postUploadAudioHandler(request, h) {
    const { id } = request.params;
    const { audio } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateAudioHeaders(audio.hapi.headers);

    await this._songsService.getSongById(id);
    await this._songsService.verifySongArtist(id, credentialId);

    const fileLocation = await this._audioStorageService.writeFile(audio, audio.hapi);

    await this._songsService.addAudioToSong(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Audio berhasil diunggah',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    await this._songsService.getSongById(id);
    await this._songsService.verifySongArtist(id, credentialId);

    const fileLocation = await this._coverStorageService.writeFile(cover, cover.hapi);

    await this._songsService.addCoverToSong(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = SongsHandler;
