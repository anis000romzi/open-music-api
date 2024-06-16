/* istanbul ignore file */
const pool = require('../src/services/postgres/pool');

const AlbumsTableTestHelper = {
  async addAlbum({
    id = 'album-123',
    name = 'Album Testing',
    year = '2022',
    artist = 'user-123',
    cover = null,
    createdAt = '2024-02-17 04:02:55.751',
    updatedAt = '2024-02-17 04:02:55.751',
  }) {
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [id, name, year, artist, cover, createdAt, updatedAt],
    };

    await pool.query(query);
  },

  async findAlbumsById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findAlbumsByName(name) {
    const query = {
      text: 'SELECT * FROM albums WHERE name = $1',
      values: [name],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM albums WHERE 1=1');
  },
};

module.exports = AlbumsTableTestHelper;
