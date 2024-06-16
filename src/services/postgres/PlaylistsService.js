const { nanoid } = require('nanoid');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = pool;
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner, isPublic }) {
    const id = `playlist-${nanoid(16)}`;

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, name, owner, createdAt, updatedAt, null, isPublic],
    };

    try {
      const result = await this._pool.query(query);
      return result.rows[0].id;
    } catch (error) {
      throw new InvariantError('Playlist gagal dibuat');
    }
  }

  async editPlaylistById({ id, name, isPublic }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE playlists SET name = $1, updated_at = $2, is_public = $3 WHERE id = $4 RETURNING id',
      values: [name, updatedAt, isPublic, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui playlist. Id tidak ditemukan');
    }
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.*, users.username
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1
      GROUP BY playlists.id, users.username`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPopularPlaylists() {
    const query = {
      text: `SELECT playlists.*, users.username
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.is_public = $1
      GROUP BY playlists.id, users.username`,
      values: [true],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(id) {
    const query = {
      text: `SELECT playlists.*, users.username, users.id as owner_id
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async getPlaylistCollaborators(id) {
    const query = {
      text: `SELECT users.id, users.username FROM users
      LEFT JOIN collaborations ON collaborations.user_id = users.id
      WHERE collaborations.playlist_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addCoverToPlaylist(id, fileLocation) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE playlists SET cover = $1, updated_at = $2 WHERE id = $3',
      values: [fileLocation, updatedAt, id],
    };

    await this._pool.query(query);
  }

  async addLikeToPlaylist(userId, playlistId) {
    const likeData = await this.verifyPlaylistLikes(userId, playlistId);

    if (likeData.rows.length) {
      throw new InvariantError('Gagal menambahkan like ke playlist');
    }

    const id = `like_playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_playlist_likes VALUES($1, $2, $3)',
      values: [id, userId, playlistId],
    };

    await this._pool.query(query);
  }

  async deleteLikeFromPlaylist(userId, playlistId) {
    const query = {
      text: 'DELETE FROM user_playlist_likes WHERE user_id = $1 AND playlist_id = $2 RETURNING id',
      values: [userId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like dari playlist');
    }
  }

  async getPlaylistLikes(id) {
    const query = {
      text: `SELECT users.id FROM users
      LEFT JOIN user_playlist_likes ON user_playlist_likes.user_id = users.id
      WHERE user_playlist_likes.playlist_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    return {
      result: result.rows,
    };
  }

  async verifyPlaylistLikes(userId, playlistId) {
    const query = {
      text: 'SELECT id FROM user_playlist_likes WHERE user_id = $1 AND playlist_id = $2',
      values: [userId, playlistId],
    };

    const result = await this._pool.query(query);

    return result;
  }

  async verifyPlaylistVisibility(playlistId, type = 'private') {
    const query = {
      text: 'SELECT is_public FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (type === 'public') {
      if (!result.rows[0].is_public) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }
    }

    if (type === 'private') {
      if (result.rows[0].is_public) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
