/* istanbul ignore file */
const pool = require('../src/services/postgres/pool');

const CollaborationsTableTestHelper = {
  async addCollaboration({
    id = 'collab-123',
    playlistId = 'playlist-123',
    userId = 'user-123',
  }) {
    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3)',
      values: [id, playlistId, userId],
    };

    await pool.query(query);
  },

  async findCollaborationsById(id) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findCollaborationsByUserId(userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE user_id = $1',
      values: [userId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findCollaborationsByPlaylistId(playlistId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE playlist_id = $1',
      values: [playlistId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM collaborations WHERE 1=1');
  },
};

module.exports = CollaborationsTableTestHelper;
