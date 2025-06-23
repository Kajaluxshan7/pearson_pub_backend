import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { CategoriesModule } from './categories/categories.module';
import { ItemsModule } from './items/items.module';
import { AddonsModule } from './addons/addons.module';
import { EventsModule } from './events/events.module';
import { OperationHoursModule } from './operation-hours/operation-hours.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.develop.env', // Specify the path to your environment file
    }),
    TypeOrmModule.forRootAsync({
      // Use forRootAsync for async configuration
      imports: [ConfigModule], // Import ConfigModule here
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: ['query', 'error'],
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
    AuthModule,
    AdminsModule,
    CategoriesModule,
    ItemsModule,
    AddonsModule,
    EventsModule,
    OperationHoursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
