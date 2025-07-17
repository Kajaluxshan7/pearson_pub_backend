import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
// In Docker, .env will be mounted, otherwise use .develop.env
const envFile = process.env.MIGRATION_MODE ? '.env' : '.develop.env';
config({ path: envFile });

console.log(`🔧 Loading environment from: ${envFile}`);
console.log(`🚀 Migration mode: ${process.env.MIGRATION_MODE || 'false'}`);
console.log(`🌍 Node environment: ${process.env.NODE_ENV || 'development'}`);

// Parse DATABASE_URL or use individual variables
let databaseConfig;

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  console.log('📊 Using DATABASE_URL configuration');
  // Parse DATABASE_URL: postgresql://username:password@host:port/database
  const url = new URL(databaseUrl);
  databaseConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
  };
} else {
  console.log('📊 Using individual environment variables');
  // Use individual environment variables
  databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'pearson_test',
  };
}

console.log(
  `📋 Database config: ${databaseConfig.username}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`,
);

const AppDataSource = new DataSource({
  type: 'postgres',
  ...databaseConfig,
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_history',
  synchronize: false, // Always false for migrations
  logging: process.env.MIGRATION_MODE ? ['error'] : ['query', 'error'],
  ssl: false, // Disable SSL for local PostgreSQL connections
});

export default AppDataSource;
