import bcrypt from 'bcrypt';
import type { Seeder } from '../types';

// Local dev accounts. Both log in with SEED_PASSWORD.
const SEED_PASSWORD = 'password123';

const users = [
  {
    id: 'user-seed-alice',
    email: 'alice@example.com',
    username: 'alice',
    fullname: 'Alice',
  },
  {
    id: 'user-seed-bob',
    email: 'bob@example.com',
    username: 'bob',
    fullname: 'Bob',
  },
];

const seeder: Seeder = {
  dependsOn: [],
  run: async (client) => {
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

    // eslint-disable-next-line no-restricted-syntax
    for (const user of users) {
      // Fixed ids + ON CONFLICT make the seeder safe to re-run.
      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `INSERT INTO users (id, email, username, password, fullname, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [user.id, user.email, user.username, hashedPassword, user.fullname],
      );
    }
  },
};

export default seeder;
