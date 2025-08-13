// data-source.ts (keep at repo root or move into src — both ok)
// ✅ Use paths relative to the compiled folder (dist), not /src
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'node:path';

// Load env: in Docker you'll pass .env; locally you may use .develop.env
const envFile = process.env.MIGRATION_MODE ? '.env' : '.develop.env';
config({ path: envFile });

const databaseUrl = process.env.DATABASE_URL;
let databaseConfig: any;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  databaseConfig = {
    host: url.hostname,
    port: Number(url.port || 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  };
} else {
  databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'pearson_db',
  };
}

// IMPORTANT: __dirname is `dist/` at runtime.
// Do NOT put `/src/` in these globs.
const ENTITIES_GLOB = __dirname + '/**/*.entity.{js,ts}';
const MIGRATIONS_GLOB = __dirname + '/src/migrations/*.{js,ts}';

const AppDataSource = new DataSource({
  type: 'postgres',
  ...databaseConfig,
  entities: [ENTITIES_GLOB],
  migrations: [MIGRATIONS_GLOB],
  migrationsTableName: 'migrations_history',
  synchronize: false,
  logging: process.env.MIGRATION_MODE ? ['error'] : ['query', 'error'],
  // If your DB requires SSL in prod, toggle via env:
  // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  ssl: false,
});

export default AppDataSource;
