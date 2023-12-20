const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(albumId) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows[0];
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
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

  async addCoverToAlbum(id, fileLocation) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2',
      values: [fileLocation, id],
    };

    await this._pool.query(query);
  }

  async addLikeToAlbum(userId, albumId) {
    const likeData = await this.verifyAlbumLikes(userId, albumId);

    if (likeData.rows.length) {
      throw new InvariantError('Gagal menambahkan like ke album');
    }

    const id = `like-${nanoid(16)}`;

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
        text: `SELECT * FROM users
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
