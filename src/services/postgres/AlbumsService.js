const { nanoid } = require('nanoid');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = pool;
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }, artist) {
    const id = `album-${nanoid(16)}`;

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, name, year, artist, null, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(albumId) {
    const query = {
      text: `SELECT albums.id, albums.name, albums.year, albums.artist as artist_id, users.fullname as artist, albums.cover
      FROM albums
      LEFT JOIN users ON users.id = albums.artist
      WHERE albums.id = $1`,
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows[0];
  }

  async getAlbumsByArtist(artistId) {
    const query = {
      text: `SELECT albums.id, albums.name, albums.year, albums.artist as artistId, users.fullname as artist, albums.cover
      FROM albums
      LEFT JOIN users ON users.id = albums.artist
      WHERE albums.artist = $1`,
      values: [artistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getPopularAlbums() {
    const query = {
      text: `SELECT albums.id, albums.name, albums.year, albums.artist as artistId, users.fullname as artist, albums.cover, COUNT(DISTINCT user_album_likes.user_id) AS likes
      FROM albums
      LEFT JOIN users ON users.id = albums.artist
      LEFT JOIN user_album_likes ON user_album_likes.album_id = albums.id
      GROUP BY albums.id, albums.name, albums.year,  albums.artist, users.fullname, albums.cover
      ORDER BY likes DESC LIMIT 20`,
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async addCoverToAlbum(id, fileLocation) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE albums SET cover = $1, updated_at = $2 WHERE id = $3',
      values: [fileLocation, updatedAt, id],
    };

    await this._pool.query(query);
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifyAlbumArtist(id, artist) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = result.rows[0];

    if (album.artist !== artist) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addLikeToAlbum(userId, albumId) {
    const likeData = await this.verifyAlbumLikes(userId, albumId);

    if (likeData.rows.length) {
      throw new InvariantError('Gagal menambahkan like ke album');
    }

    const id = `like_album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3)',
      values: [id, userId, albumId],
    };

    await this._pool.query(query);

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async deleteLikeFromAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like dari album');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async getAlbumLikes(id) {
    try {
      const result = await this._cacheService.get(`albums:${id}`);
      return {
        cache: true,
        result: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: `SELECT users.id FROM users
        LEFT JOIN user_album_likes ON user_album_likes.user_id = users.id
        WHERE user_album_likes.album_id = $1`,
        values: [id],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`albums:${id}`, JSON.stringify(result.rows));

      return {
        cache: false,
        result: result.rows,
      };
    }
  }

  async verifyAlbumLikes(userId, albumId) {
    const query = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    return result;
  }
}

module.exports = AlbumsService;
