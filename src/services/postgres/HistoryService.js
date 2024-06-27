const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class HistoryService {
  constructor() {
    this._pool = new Pool();
  }

  async addHistory(songId, userId) {
    const id = `history-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: `
        INSERT INTO history (id, user_id, song_id, time)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, song_id)
        DO UPDATE SET time = EXCLUDED.time
        RETURNING id
      `,
      values: [id, userId, songId, time],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('History gagal dibuat');
    }

    return result.rows[0].id;
  }

  async getHistory(userId) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.artist as artist_id, users.fullname as artist, songs.audio, songs.cover, songs.duration
      FROM history
      LEFT JOIN songs ON songs.id = history.song_id
      LEFT JOIN users ON users.id = songs.artist
      WHERE history.user_id = $1
      ORDER BY history.time DESC LIMIT 50`,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = HistoryService;
