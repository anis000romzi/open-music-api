const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, duration, albumId,
  }, artist) {
    const id = `song-${nanoid(16)}`;

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      values: [id, title, year, genre, artist, duration, albumId, null, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs(title, artist) {
    let query = {
      text: `SELECT songs.id, songs.title, users.username, songs.audio
      FROM songs
      LEFT JOIN users ON users.id = songs.artist`,
    };

    if (title !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, users.username, songs.audio
        FROM songs
        LEFT JOIN users ON users.id = songs.artist
        WHERE songs.title ILIKE '%' || $1 || '%'`,
        values: [title],
      };
    }
    if (artist !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, users.username, songs.audio
        FROM songs
        LEFT JOIN users ON users.id = songs.artist
        WHERE users.username ILIKE '%' || $1 || '%'`,
        values: [artist],
      };
    }
    if (title !== undefined && artist !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, users.username, songs.audio
        FROM songs
        LEFT JOIN users ON users.id = songs.artist
        WHERE songs.title ILIKE '%' || $1 || '%' AND users.username ILIKE '%' || $2 || '%'`,
        values: [title, artist],
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async addAudioToSong(id, fileLocation) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE songs SET audio = $1, updated_at = $2 WHERE id = $3',
      values: [fileLocation, updatedAt, id],
    };

    await this._pool.query(query);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }

  async getSongsByAlbum(id) {
    const query = {
      text: `SELECT songs.id, songs.title, users.username, songs.audio
        FROM songs
        LEFT JOIN users ON users.id = songs.artist
        WHERE songs.album_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async editSongById(id, {
    title, year, genre, artist, duration, albumId,
  }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, artist = $4, duration = $5, album_id = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      values: [title, year, genre, artist, duration, albumId, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifySongArtist(id, artist) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const song = result.rows[0];

    if (song.artist !== artist) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist_song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
    }
    return result.rows[0].id;
  }

  async getSongsByPlaylist(id) {
    const query = {
      text: `SELECT songs.id, songs.title, users.username
      FROM songs
      LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id
      LEFT JOIN users ON users.id = songs.artist
      WHERE playlist_songs.playlist_id = $1
      GROUP BY songs.id`,
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus lagu dari playlist');
    }
  }

  async addLikeToSong(userId, songId) {
    const likeData = await this.verifySongLikes(userId, songId);

    if (likeData.rows.length) {
      throw new InvariantError('Gagal menambahkan like ke lagu');
    }

    const id = `like_song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_song_likes VALUES($1, $2, $3)',
      values: [id, userId, songId],
    };

    await this._pool.query(query);
  }

  async deleteLikeFromSong(userId, songId) {
    const query = {
      text: 'DELETE FROM user_song_likes WHERE user_id = $1 AND song_id = $2 RETURNING id',
      values: [userId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like dari lagu');
    }
  }

  async getSongLikes(id) {
    const query = {
      text: `SELECT * FROM users
      LEFT JOIN user_song_likes ON user_song_likes.user_id = users.id
      WHERE user_song_likes.song_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    return {
      result: result.rows,
    };
  }

  async verifySongLikes(userId, songId) {
    const query = {
      text: 'SELECT id FROM user_song_likes WHERE user_id = $1 AND song_id = $2',
      values: [userId, songId],
    };

    const result = await this._pool.query(query);

    return result;
  }
}

module.exports = SongsService;
