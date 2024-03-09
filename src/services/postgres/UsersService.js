const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class UsersService {
  constructor(cacheService) {
    this._pool = pool;
    this._cacheService = cacheService;
  }

  async addUser({
    email, username, password, fullname,
  }) {
    await this.verifyNewUsername(username);
    await this.verifyNewEmail(email);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      values: [
        id, email, username, hashedPassword, fullname, false, createdAt, updatedAt, null, null,
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, email, username, fullname, description, picture, is_active FROM users WHERE id = $1',
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }

  async getUserByEmail(email) {
    const query = {
      text: 'SELECT id, username FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }

  async editUserById(id, { fullname, description }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET fullname = $1, description = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [fullname, description, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui user. Id tidak ditemukan');
    }
  }

  // only edit email if user is not active yet
  async editUserEmailById(id, newEmail) {
    const updatedAt = new Date().toISOString();
    const { is_active: isActive, email } = await this.getUserById(id);

    if (newEmail !== email) {
      await this.verifyNewEmail(newEmail);
    }

    if (isActive) {
      throw new AuthorizationError('Gagal mengganti email user. User telah aktif');
    }

    const query = {
      text: 'UPDATE users SET email = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [newEmail, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal mengganti email user. Id tidak ditemukan');
    }
  }

  async activateUserById(id, otp) {
    const storedOtp = await this._cacheService.get(`verify:${id}`);

    if (storedOtp !== otp) {
      throw new InvariantError('Gagal verifikasi user, kode otp tidak sama');
    }

    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET is_active = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [true, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal mengaktifkan user');
    }

    await this._cacheService.delete(`verify:${id}`);
    return result.rows[0].id;
  }

  async resetUserPasswordById(id, otp, password) {
    const storedOtp = await this._cacheService.get(`forgot:${id}`);

    if (storedOtp !== otp) {
      throw new InvariantError('Gagal verifikasi user, kode otp tidak sama');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [hashedPassword, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal mengubah password user');
    }

    await this._cacheService.delete(`forgot:${id}`);
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async verifyNewEmail(email) {
    const query = {
      text: 'SELECT email FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Email sudah digunakan.');
    }
  }

  async verifyUserCredential(usernameOrEmail, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1 OR email = $1',
      values: [usernameOrEmail],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    const { id, password: hashedPassword } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    return id;
  }

  async verifyLoggedUser(id, loggedUser) {
    const query = {
      text: 'SELECT id FROM users WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const user = result.rows[0];

    if (user.id !== loggedUser) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addProfilePicture(id, fileLocation) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET picture = $1, updated_at = $2 WHERE id = $3',
      values: [fileLocation, updatedAt, id],
    };

    await this._pool.query(query);
  }
}

module.exports = UsersService;
