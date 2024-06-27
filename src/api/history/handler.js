const autoBind = require('auto-bind');

class HistoryHandler {
  constructor(historyService, songsService) {
    this._historyService = historyService;
    this._songsService = songsService;

    autoBind(this);
  }

  async postHistoryHandler(request, h) {
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._historyService.addHistory(songId, credentialId);
    await this._songsService.addListenedCountToSong(songId);

    const response = h.response({
      status: 'success',
      message: 'History berhasil ditambahkan',
    });

    response.code(201);
    return response;
  }

  async getHistoryHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    const history = await this._historyService.getHistory(credentialId);

    return {
      status: 'success',
      data: {
        history,
      },
    };
  }
}

module.exports = HistoryHandler;
