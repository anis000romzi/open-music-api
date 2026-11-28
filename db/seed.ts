import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import type { NamedSeeder, Seeder } from './types';

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const seedsDir = path.join(__dirname, 'seeders');

function topologicalSort(seeds: Record<string, NamedSeeder>): NamedSeeder[] {
  const sorted: NamedSeeder[] = [];
  const visited = new Set<string>();

  function visit(name: string, ancestors: string[] = []) {
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

const isSeederFile = (file: string) => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts');

(async () => {
  try {
    await client.connect();

    const files = fs.readdirSync(seedsDir).filter(isSeederFile);
    const seeds: Record<string, NamedSeeder> = {};

    await Promise.all(
      files.map(async (file) => {
        const name = path.basename(file, path.extname(file));
        const seedModule = await import(path.join(seedsDir, file));
        const seed: Seeder = seedModule.default || seedModule;
        seeds[name] = { ...seed, name };
      }),
    );

    const sortedSeeds = topologicalSort(seeds);

    // eslint-disable-next-line no-restricted-syntax
    for (const seed of sortedSeeds) {
      console.log(`📄 Running ${seed.name}`);
      // eslint-disable-next-line no-await-in-loop
      await seed.run(client);
    }

    console.log('✅ All seeds completed in dependency-safe order.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
