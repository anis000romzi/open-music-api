const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const seedsDir = path.join(__dirname, 'seeders');

function topologicalSort(seeds) {
  const sorted = [];
  const visited = new Set();

  function visit(name, ancestors = []) {
    if (visited.has(name)) return;
    const seed = seeds[name];
    if (!seed) throw new Error(`Seeder "${name}" not found`);

    ancestors.push(name);

    seed.dependsOn?.forEach((dep) => {
      if (ancestors.includes(dep)) {
        throw new Error(`Circular dependency: ${name} -> ${dep}`);
      }
      visit(dep, ancestors.slice());
    });

    visited.add(name);
    sorted.push(seed);
  }

  Object.keys(seeds).forEach((name) => visit(name));
  return sorted;
}

(async () => {
  try {
    await client.connect();

    const files = fs.readdirSync(seedsDir).filter((f) => f.endsWith('.js'));
    const seeds = {};

    await Promise.all(
      files.map(async (file) => {
        const name = path.basename(file, '.js');
        const seedModule = await import(path.join(seedsDir, file));
        const seed = seedModule.default || seedModule;
        seeds[name] = { ...seed, name };
      }),
    );

    const sortedSeeds = topologicalSort(seeds);

    await Promise.all(
      sortedSeeds.map(async (seed) => {
        console.log(`📄 Running ${seed.name}`);
        await seed.run(client);
      }),
    );

    console.log('✅ All seeds completed in dependency-safe order.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
})();
