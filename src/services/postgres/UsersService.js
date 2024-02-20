const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

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
      text: 'INSERT INTO users VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      values: [id, email, username, hashedPassword, fullname, false, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, email, username, fullname FROM users WHERE id = $1',
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
      text: 'SELECT id, email, username, fullname FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }

  async activateUser(email, otp) {
    const storedOtp = await this._cacheService.get(`verify:${email}`);

    if (storedOtp !== otp) {
      throw new InvariantError('Gagal verifikasi user, kode otp tidak sama');
    }

    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET is_active = $1, updated_at = $2 WHERE email = $3 RETURNING id',
      values: [true, updatedAt, email],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal mengaktifkan user');
    }

    await this._cacheService.delete(`verify:${email}`);
    return result.rows[0].id;
  }

  async resetUserPassword(email, otp, password) {
    const storedOtp = await this._cacheService.get(`forgot:${email}`);

    if (storedOtp !== otp) {
      throw new InvariantError('Gagal verifikasi user, kode otp tidak sama');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE users SET password = $1, updated_at = $2 WHERE email = $3 RETURNING id',
      values: [hashedPassword, updatedAt, email],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal mengubah password user');
    }

    await this._cacheService.delete(`forgot:${email}`);
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
      text: 'SELECT id, password, is_active FROM users WHERE username = $1 OR email = $1',
      values: [usernameOrEmail],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    const { id, password: hashedPassword, is_active: isActive } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    if (!isActive) {
      throw new AuthenticationError('Silahkan verifikasi akun anda');
    }

    return id;
  }
}

module.exports = UsersService;
