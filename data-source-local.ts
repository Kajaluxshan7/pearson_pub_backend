import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Force load the development environment
config({ path: '.develop.env' });

console.log(`🔧 Loading environment from: .develop.env`);
console.log(`🚀 Migration mode: false`);
console.log(`🌍 Node environment: development`);

// Use individual environment variables for local development
const databaseConfig = {
  host: 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'pearson_test',
};

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
  logging: ['query', 'error'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;
