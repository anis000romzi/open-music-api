const { Pool } = require('pg');

class GenresService {
  constructor() {
    this._pool = new Pool();
  }

  async getGenres() {
    const query = {
      text: 'SELECT * FROM genres',
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = GenresService;
