import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './items/items.module';
import { AddonsModule } from './addons/addons.module';
import { EventsModule } from './events/events.module';
import { OperationHoursModule } from './operation-hours/operation-hours.module';
import { SpecialsModule } from './specials/specials.module';
import { WingSaucesModule } from './wing-sauces/wing-sauces.module';
import { SubstituteSidesModule } from './substitute-sides/substitute-sides.module';
import { TasksModule } from './tasks/tasks.module';
import { PublicApiModule } from './public-api/public-api.module';
import { StoriesModule } from './stories/stories.module';
import { TimezoneService } from './common/services/timezone.service';
import { HealthController } from './common/health.controller';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.develop.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors, not just the first one
        allowUnknown: true, // Allow other environment variables not in schema
      },
    }),
    TypeOrmModule.forRootAsync({
      // Use forRootAsync for async configuration
      imports: [ConfigModule], // Import ConfigModule here
      useFactory: (configService: ConfigService) => {
        // Parse DATABASE_URL or use individual variables
        const databaseUrl = configService.get<string>('DATABASE_URL');
        let databaseConfig;

        if (databaseUrl) {
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
          // Use individual environment variables as fallback
          databaseConfig = {
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE', 'pearson_db'),
          };
        }

        return {
          type: 'postgres',
          ...databaseConfig,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false, // Always use migrations instead of schema synchronization
          logging: ['query', 'error'],
          ssl:
            configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
      inject: [ConfigService], // Inject ConfigService
    }),
    AuthModule,
    AdminsModule,
    CategoriesModule,
    ItemsModule,
    AddonsModule,
    EventsModule,
    OperationHoursModule,
    SpecialsModule,
    WingSaucesModule,
    SubstituteSidesModule,
    TasksModule,
    PublicApiModule,
    StoriesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, TimezoneService],
  exports: [TimezoneService],
})
export class AppModule {}
