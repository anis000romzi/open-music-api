/* istanbul ignore file */
const pool = require('../src/services/postgres/pool');

const GenresTableTestHelper = {
  async addGenre({
    id = '1',
    name = 'pop',
  }) {
    const query = {
      text: 'INSERT INTO genres VALUES($1, $2)',
      values: [id, name],
    };

    await pool.query(query);
  },

  async findGenresById(id) {
    const query = {
      text: 'SELECT * FROM genres WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findGenresByName(name) {
    const query = {
      text: 'SELECT * FROM genres WHERE name = $1',
      values: [name],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM genres WHERE 1=1');
  },
};

module.exports = GenresTableTestHelper;
