import autoBind from 'auto-bind';
import { IGenresService } from '../../services/interfaces/IGenresService';

export class GenresHandler {
  private _genresService: IGenresService;

  constructor(genresService: IGenresService) {
    this._genresService = genresService;

    autoBind(this);
  }

  async getGenresHandler() {
    const genres = await this._genresService.getGenres();

    return {
      status: 'success',
      data: {
        genres,
      },
    };
  }
}
