/* istanbul ignore file */
import pool from '../src/services/postgres/pool';

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

  async findGenresById(id: string) {
    const query = {
      text: 'SELECT * FROM genres WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findGenresByName(name: string) {
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

export default GenresTableTestHelper;
