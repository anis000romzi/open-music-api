import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import { AddHistoryPayload, IHistoryService } from '../../services/interfaces/IHistoryService';
import { ISongsService } from '../../services/interfaces/ISongsService';

export class HistoryHandler {
  private _historyService: IHistoryService;
  private _songsService: ISongsService;

  constructor(historyService: IHistoryService, songsService: ISongsService) {
    this._historyService = historyService;
    this._songsService = songsService;

    autoBind(this);
  }

  async postHistoryHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { songId } = request.payload as AddHistoryPayload;
    const { id: credentialId } = request.auth.credentials as { id: string };

    await this._historyService.addHistory(songId, credentialId);
    await this._songsService.addListenedCountToSong(songId);

    const response = h.response({
      status: 'success',
      message: 'History created successfully',
    });

    response.code(201);
    return response;
  }

  async getHistoryHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials as { id: string };

    const history = await this._historyService.getHistory(credentialId);

    return {
      status: 'success',
      data: {
        history,
      },
    };
  }
}
