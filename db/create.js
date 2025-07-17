const { Client } = require('pg');
require('dotenv').config();

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
} = process.env;

(async () => {
  const client = new Client({
    host: PGHOST,
    port: PGPORT,
    user: PGUSER,
    password: PGPASSWORD,
    database: 'postgres', // connect to default db first
  });

  try {
    await client.connect();
    const checkDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [PGDATABASE]);

    if (checkDb.rowCount === 0) {
      await client.query(`CREATE DATABASE "${PGDATABASE}"`);
      console.log(`Database "${PGDATABASE}" created!`);
    } else {
      console.log(`Database "${PGDATABASE}" already exists.`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
  } finally {
    await client.end();
  }
})();
