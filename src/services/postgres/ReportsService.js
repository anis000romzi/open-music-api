const { nanoid } = require('nanoid');
const pool = require('./pool');
const InvariantError = require('../../exceptions/InvariantError');

class ReportsService {
  constructor() {
    this._pool = pool;
  }

  async addReport({
    songId, userId, reason, detail,
  }) {
    const id = `report-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `
        INSERT INTO reports VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `,
      values: [id, userId, songId, reason, detail, 'pending', createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to create report');
    }

    return result.rows[0].id;
  }
}

module.exports = ReportsService;
