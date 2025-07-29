import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { CategoriesModule } from '../categories/categories.module';
import { ItemsModule } from '../items/items.module';
import { EventsModule } from '../events/events.module';
import { OperationHoursModule } from '../operation-hours/operation-hours.module';
import { SpecialsModule } from '../specials/specials.module';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [
    CategoriesModule,
    ItemsModule,
    EventsModule,
    OperationHoursModule,
    SpecialsModule,
    StoriesModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService],
})
export class PublicApiModule {}
