const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(producerService, playlistsService, validator) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    this._validator.validateExportPlaylistPayload(request.payload);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistsService.getPlaylistById(playlistId);

    await this._producerService.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
