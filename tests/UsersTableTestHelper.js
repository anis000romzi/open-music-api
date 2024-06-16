/* istanbul ignore file */
const pool = require('../src/services/postgres/pool');

const UsersTableTestHelper = {
  async addUser({
    id = 'user-123',
    email = 'testing@gmail.com',
    username = 'testing',
    password = '$2a$10$juglyJyQ7QEVQiQ3t8cSWe1W.s/qn8aW1rSWVEpM11XZEv7O43Pue', // secret
    fullname = 'Testing testing',
    isActive = false,
    createdAt = '2024-02-17 04:02:55.751',
    updatedAt = '2024-02-17 04:02:55.751',
    description = 'This is a testing account',
    picture = 'path/to/file',
  }) {
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      values: [
        id,
        email,
        username,
        password,
        fullname,
        isActive,
        createdAt,
        updatedAt,
        description,
        picture,
      ],
    };

    await pool.query(query);
  },

  async findUsersById(id) {
    const query = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findUsersByUsername(username) {
    const query = {
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM users WHERE 1=1');
  },
};

module.exports = UsersTableTestHelper;
