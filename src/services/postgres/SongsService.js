const { nanoid } = require('nanoid');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class SongsService {
  constructor(cacheService) {
    this._pool = pool;
    this._cacheService = cacheService;
  }

  async addSong({
    title, year, genre, duration, albumId,
  }, artist) {
    const id = `song-${nanoid(16)}`;

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      values: [id, title, year, genre, artist, duration, albumId, null, createdAt, updatedAt, null],
    };

    try {
      const result = await this._pool.query(query);
      return result.rows[0].id;
    } catch (error) {
      throw new InvariantError('Failed to create song');
    }
  }

  async getSongs(title, artist, genre) {
    let query = {
      text: `SELECT songs.id, songs.title, albums.name as album, songs.artist as artist_id, users.fullname as artist, genres.name as genre, songs.listened, songs.audio, songs.cover, songs.duration
      FROM songs
      LEFT JOIN albums ON albums.id = songs.album_id
      LEFT JOIN genres ON genres.id = songs.genre
      LEFT JOIN users ON users.id = songs.artist
      WHERE songs.is_removed = false AND users.is_banned = false LIMIT 20`,
    };

    if (title !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, songs.artist as artist_id, albums.name as album, users.fullname as artist, genres.name as genre, songs.listened, songs.audio, songs.cover, songs.duration
        FROM songs
        LEFT JOIN albums ON albums.id = songs.album_id
        LEFT JOIN genres ON genres.id = songs.genre
        LEFT JOIN users ON users.id = songs.artist
        WHERE songs.title ILIKE '%' || $1 || '%' AND songs.is_removed = false LIMIT 20`,
        values: [title],
      };
    }
    if (artist !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, songs.artist as artist_id, albums.name as album, users.fullname as artist, genres.name as genre, songs.listened, songs.audio, songs.cover, songs.duration
        FROM songs
        LEFT JOIN albums ON albums.id = songs.album_id
        LEFT JOIN genres ON genres.id = songs.genre
        LEFT JOIN users ON users.id = songs.artist
        WHERE users.fullname ILIKE '%' || $1 || '%' AND songs.is_removed = false AND users.is_banned = false LIMIT 20`,
        values: [artist],
      };
    }
    if (genre !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, songs.artist as artist_id, albums.name as album, users.fullname as artist, genres.name as genre, songs.listened, songs.audio, songs.cover, songs.duration
        FROM songs
        LEFT JOIN albums ON albums.id = songs.album_id
        LEFT JOIN genres ON genres.id = songs.genre
        LEFT JOIN users ON users.id = songs.artist
        WHERE genres.name ILIKE '%' || $1 || '%' AND songs.is_removed = false AND users.is_banned = false LIMIT 20`,
        values: [genre],
      };
    }
    if (title !== undefined && artist !== undefined) {
      query = {
        text: `SELECT songs.id, songs.title, songs.artist as artist_id, albums.name as album, users.fullname as artist, songs.listened, songs.audio, songs.cover, songs.duration
        FROM songs
        LEFT JOIN albums ON albums.id = songs.album_id
        LEFT JOIN genres ON genres.id = songs.genre
        LEFT JOIN users ON users.id = songs.artist
        WHERE songs.title ILIKE '%' || $1 || '%' OR users.fullname ILIKE '%' || $2 || '%' AND songs.is_removed = false AND users.is_banned = false LIMIT 20`,
        values: [title, artist],
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPopularSongs() {
    const query = {
      text: `SELECT songs.id, songs.title, songs.artist as artist_id, albums.name as album, users.fullname as artist, songs.listened, songs.audio, songs.cover, songs.duration, COUNT(DISTINCT user_song_likes.user_id) AS likes
      FROM songs
      LEFT JOIN users ON users.id = songs.artist
      LEFT JOIN albums ON albums.id = songs.album_id
      LEFT JOIN user_song_likes ON user_song_likes.song_id = songs.id
      GROUP BY songs.id, songs.title, albums.name, users.fullname, songs.audio
      ORDER BY likes DESC, songs.listened DESC LIMIT 20`,
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getLikedSongs(userId) {
    const query = {
      text: `SELECT songs.id, songs.title, albums.name as album, songs.artist as artist_id, users.fullname as artist, songs.listened, songs.audio, songs.cover, songs.duration
      FROM songs
      LEFT JOIN users ON users.id = songs.artist
      LEFT JOIN albums ON albums.id = songs.album_id
      LEFT JOIN user_song_likes ON user_song_likes.song_id = songs.id
      WHERE user_song_likes.user_id = $1 AND songs.is_removed = false`,
      values: [userId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getRecentSongs() {
    const query = {
      text: `SELECT songs.id, songs.title, albums.name as album, users.username as artist, songs.audio
      FROM songs
      LEFT JOIN users ON users.id = songs.artist
      LEFT JOIN albums ON albums.id = songs.album_id
      ORDER BY songs.created_at DESC`,
    };

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

  async addListenedCountToSong(id) {
    const query = {
      text: 'UPDATE songs SET listened = listened + 1 WHERE id = $1',
      values: [id],
    };

    await this._pool.query(query);
  }

  async getSongById(id) {
    const query = {
      text: `SELECT         
        songs.id, 
        songs.title, 
        albums.name as album, 
        songs.year, 
        users.fullname as artist, 
        songs.artist as artist_id, 
        genres.name as genre, 
        songs.genre as genre_id, 
        songs.duration, 
        songs.audio, 
        songs.cover 
      FROM 
        songs 
        LEFT JOIN albums ON albums.id = songs.album_id 
        LEFT JOIN genres ON genres.id = songs.genre 
        LEFT JOIN users ON users.id = songs.artist 
      WHERE
        songs.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Song not found');
    }

    return result.rows[0];
  }

  async getSongsByAlbum(id) {
    const query = {
      text: `SELECT 
        songs.id, 
        songs.title, 
        albums.name as album, 
        songs.year, 
        users.fullname as artist, 
        songs.artist as artist_id, 
        genres.name as genre, 
        songs.genre as genre_id, 
        songs.duration,
        songs.listened, 
        songs.audio, 
        songs.cover 
      FROM 
        songs 
        LEFT JOIN albums ON albums.id = songs.album_id 
        LEFT JOIN genres ON genres.id = songs.genre 
        LEFT JOIN users ON users.id = songs.artist 
      WHERE 
        songs.album_id = $1 AND songs.is_removed = false AND users.is_banned = false
      ORDER BY songs.created_at ASC`,
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getSongsByArtist(artistId, owned) {
    let query = {
      text: `SELECT 
        songs.id, 
        songs.title, 
        albums.name as album, 
        songs.album_id,
        songs.year, 
        users.fullname as artist, 
        songs.artist as artist_id, 
        genres.name as genre, 
        songs.genre as genre_id, 
        songs.duration,
        songs.listened, 
        songs.audio, 
        songs.cover 
      FROM 
        songs 
        LEFT JOIN albums ON albums.id = songs.album_id 
        LEFT JOIN genres ON genres.id = songs.genre 
        LEFT JOIN users ON users.id = songs.artist
      WHERE 
        songs.artist = $1 AND songs.is_removed = false AND users.is_banned = false`,
      values: [artistId],
    };

    if (owned) {
      query = {
        text: `SELECT 
          songs.id, 
          songs.title, 
          albums.name as album, 
          songs.album_id,
          songs.year, 
          users.fullname as artist, 
          songs.artist as artist_id, 
          genres.name as genre, 
          songs.genre as genre_id, 
          songs.duration,
          songs.listened, 
          songs.audio, 
          songs.cover 
        FROM 
          songs 
          LEFT JOIN albums ON albums.id = songs.album_id 
          LEFT JOIN genres ON genres.id = songs.genre 
          LEFT JOIN users ON users.id = songs.artist
        WHERE 
          songs.artist = $1`,
        values: [artistId],
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getSinglesByArtist(artistId, owned) {
    let query = {
      text: `SELECT 
        songs.id, 
        songs.title, 
        albums.name as album, 
        songs.year, 
        users.fullname as artist, 
        songs.artist as artist_id, 
        genres.name as genre, 
        songs.genre as genre_id, 
        songs.duration,
        songs.listened, 
        songs.audio, 
        songs.cover 
      FROM 
        songs 
        LEFT JOIN albums ON albums.id = songs.album_id 
        LEFT JOIN genres ON genres.id = songs.genre 
        LEFT JOIN users ON users.id = songs.artist 
      WHERE 
        songs.artist = $1 AND albums.name IS NULL AND songs.is_removed = false AND users.is_banned = false`,
      values: [artistId],
    };

    if (owned) {
      query = {
        text: `SELECT 
          songs.id, 
          songs.title, 
          albums.name as album, 
          songs.year, 
          users.fullname as artist, 
          songs.artist as artist_id, 
          genres.name as genre, 
          songs.genre as genre_id, 
          songs.duration,
          songs.listened, 
          songs.audio, 
          songs.cover 
        FROM 
          songs 
          LEFT JOIN albums ON albums.id = songs.album_id 
          LEFT JOIN genres ON genres.id = songs.genre 
          LEFT JOIN users ON users.id = songs.artist 
        WHERE 
          songs.artist = $1 AND albums.name IS NULL`,
        values: [artistId],
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async editSongById(id, {
    title, year, genre, duration, albumId,
  }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, duration = $4, album_id = $5, updated_at = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, duration, albumId, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to edit song. Id not found');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to delete song. Id not found');
    }
  }

  async addCoverToSong(id, fileLocation) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE songs SET cover = $1, updated_at = $2 WHERE id = $3',
      values: [fileLocation, updatedAt, id],
    };

    await this._pool.query(query);
  }

  async verifySongArtist(id, artist) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Song not found');
    }

    const song = result.rows[0];

    if (song.artist !== artist) {
      throw new AuthorizationError('You are not authorized to access this resource');
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
      throw new InvariantError('Failed to add song to a playlist');
    }
    return result.rows[0].id;
  }

  async addSongToAlbum(albumId, songId) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE songs SET album_id = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [albumId, songId, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Failed to add song to album');
    }
    return result.rows[0].id;
  }

  async getSongsByPlaylist(id) {
    const query = {
      text: `SELECT songs.id, songs.title, albums.name as album, users.fullname as artist, songs.listened, songs.audio, songs.cover, songs.duration
      FROM songs
      LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id
      LEFT JOIN albums ON albums.id = songs.album_id 
      LEFT JOIN users ON users.id = songs.artist
      WHERE playlist_songs.playlist_id = $1 AND songs.is_removed = false AND users.is_banned = false`,
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
      throw new InvariantError('Failed to delete song from playlist');
    }
  }

  async addLikeToSong(userId, songId) {
    const likeData = await this.verifySongLikes(userId, songId);

    if (likeData.rows.length) {
      throw new InvariantError('Failed to like song');
    }

    const id = `like_song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_song_likes VALUES($1, $2, $3)',
      values: [id, userId, songId],
    };

    await this._pool.query(query);

    await this._cacheService.delete(`song:${songId}`);
  }

  async deleteLikeFromSong(userId, songId) {
    const query = {
      text: 'DELETE FROM user_song_likes WHERE user_id = $1 AND song_id = $2 RETURNING id',
      values: [userId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Failed to unlike song');
    }

    await this._cacheService.delete(`song:${songId}`);
  }

  async getSongLikes(id) {
    try {
      const result = await this._cacheService.get(`song:${id}`);
      return {
        cache: true,
        result: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: `SELECT users.id FROM users
        LEFT JOIN user_song_likes ON user_song_likes.user_id = users.id
        WHERE user_song_likes.song_id = $1`,
        values: [id],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`song:${id}`, JSON.stringify(result.rows));

      return {
        result: result.rows,
      };
    }
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
