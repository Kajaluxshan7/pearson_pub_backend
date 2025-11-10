// data-source.ts - TypeORM CLI Data Source Configuration
// This file is used by TypeORM CLI for migrations
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
const envFile = process.env.MIGRATION_MODE ? '.env' : '.develop.env';
config({ path: envFile });

// Parse database configuration
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

// Determine if we're running from compiled JavaScript or TypeScript source
const isCompiled = __filename.endsWith('.js');
const baseDir = isCompiled ? __dirname : path.join(__dirname, 'dist');

// Configure paths based on execution context
// When running compiled code (production/migrations), use dist/ paths
// When running from source (development), use src/ paths
const ENTITIES_GLOB = isCompiled
  ? path.join(__dirname, '**', '*.entity.js')
  : path.join(__dirname, 'src', '**', '*.entity.ts');

const MIGRATIONS_GLOB = isCompiled
  ? path.join(__dirname, 'migrations', '*.js')
  : path.join(__dirname, 'src', 'migrations', '*.ts');

const AppDataSource = new DataSource({
  type: 'postgres',
  ...databaseConfig,
  entities: [ENTITIES_GLOB],
  migrations: [MIGRATIONS_GLOB],
  migrationsTableName: 'migrations_history',
  synchronize: false, // Always use migrations in production
  logging: process.env.LOG_LEVEL === 'debug' ? ['query', 'error'] : ['error'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;
