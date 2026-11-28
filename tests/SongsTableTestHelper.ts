/* istanbul ignore file */
import pool from '../src/services/postgres/pool';

const SongsTableTestHelper = {
  async addSong({
    id = 'song-123',
    title = 'Song Testing',
    year = '2022',
    genre = '1',
    artist = 'user-123',
    duration = 100,
    albumId = 'album-123',
    audio = null,
    cover = null,
    createdAt = '2024-02-17 04:02:55.751',
    updatedAt = '2024-02-17 04:02:55.751',
  }) {
    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      values: [
        id, title, year, genre, artist, duration, albumId, audio, createdAt, updatedAt, cover,
      ],
    };

    await pool.query(query);
  },

  async findSongsById(id: string) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findSongsByTitle(title: string) {
    const query = {
      text: 'SELECT * FROM songs WHERE title = $1',
      values: [title],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM songs WHERE 1=1');
  },
};

export default SongsTableTestHelper;
