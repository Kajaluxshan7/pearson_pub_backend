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
import { SpecialsModule } from './specials/specials.module';
import { WingSaucesModule } from './wing-sauces/wing-sauces.module';
import { SubstituteSidesModule } from './substitute-sides/substitute-sides.module';
import { ItemAddonsRelationsModule } from './item-addons-relations/item-addons-relations.module';
import { TasksModule } from './tasks/tasks.module';
import { PublicApiModule } from './public-api/public-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: ['.env.development', '.env'], // Specify the path to your environment file
      // envFilePath: '.develop.env', // Specify the path to your environment file
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
    SpecialsModule,
    WingSaucesModule,
    SubstituteSidesModule,
    ItemAddonsRelationsModule,
    TasksModule,
    PublicApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
