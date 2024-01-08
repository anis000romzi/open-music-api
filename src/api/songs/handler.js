const autoBind = require('auto-bind');

class SongsHandler {
  constructor(songsService, storageService, songsValidator, uploadsValidator) {
    this._songsService = songsService;
    this._storageService = storageService;
    this._songsValidator = songsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    this._songsValidator.validateSongPayload(request.payload);

    const songId = await this._songsService.addSong(request.payload);

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
    const { title, performer } = request.query;
    const songs = await this._songsService.getSongs(title, performer);

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

    await this._songsService.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;

    await this._songsService.deleteSongById(id);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }

  async postUploadAudioHandler(request, h) {
    const { id } = request.params;
    const { audio } = request.payload;
    this._uploadsValidator.validateAudioHeaders(audio.hapi.headers);

    await this._songsService.getSongById(id);
    const filename = await this._storageService.writeFile(audio, audio.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/songs/audio/${filename}`;
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
}

module.exports = SongsHandler;
