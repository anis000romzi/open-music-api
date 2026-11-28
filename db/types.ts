import type { Client } from 'pg';

export interface Seeder {
  /** Seeder file names (without extension) that must run before this one. */
  dependsOn?: string[];
  run: (client: Client) => Promise<void>;
}

export interface NamedSeeder extends Seeder {
  name: string;
}
