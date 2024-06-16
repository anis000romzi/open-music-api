const autoBind = require('auto-bind');

class GenresHandler {
  constructor(genresService) {
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

module.exports = GenresHandler;
