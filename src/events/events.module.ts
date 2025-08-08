import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { TimezoneService } from '../common/services/timezone.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [EventsService, FileUploadService, TimezoneService],
  exports: [EventsService],
})
export class EventsModule {}
