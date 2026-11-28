import { Client } from 'pg';
import 'dotenv/config';

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
} = process.env;

(async () => {
  if (!PGDATABASE) {
    console.error('PGDATABASE is not set.');
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    host: PGHOST,
    port: PGPORT ? Number(PGPORT) : undefined,
    user: PGUSER,
    password: PGPASSWORD,
    database: 'postgres', // connect to default db first
  });

  try {
    await client.connect();
    const checkDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [PGDATABASE]);

    if (checkDb.rowCount === 0) {
      await client.query(`CREATE DATABASE "${PGDATABASE.replace(/"/g, '""')}"`);
      console.log(`Database "${PGDATABASE}" created!`);
    } else {
      console.log(`Database "${PGDATABASE}" already exists.`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
