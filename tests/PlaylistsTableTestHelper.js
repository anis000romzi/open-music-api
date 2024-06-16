/* istanbul ignore file */
const pool = require('../src/services/postgres/pool');

const PlaylistsTableTestHelper = {
  async addPlaylist({
    id = 'playlist-123',
    name = 'Playlist Testing',
    owner = 'user-123',
    isPublic = false,
    cover = null,
    createdAt = '2024-02-16T21:02:55.751Z',
    updatedAt = '2024-02-16T21:02:55.751Z',
  }) {
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [id, name, owner, createdAt, updatedAt, cover, isPublic],
    };

    await pool.query(query);
  },

  async findPlaylistsById(id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findPlaylistsByName(name) {
    const query = {
      text: 'SELECT * FROM playlists WHERE name = $1',
      values: [name],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM playlists WHERE 1=1');
  },
};

module.exports = PlaylistsTableTestHelper;
