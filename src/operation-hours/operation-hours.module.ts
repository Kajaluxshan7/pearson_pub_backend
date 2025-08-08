import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationHoursService } from './operation-hours.service';
import { OperationHoursController } from './operation-hours.controller';
import { OperationHour } from './entities/operation-hour.entity';
import { TimezoneService } from '../common/services/timezone.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperationHour])],
  controllers: [OperationHoursController],
  providers: [OperationHoursService, TimezoneService],
  exports: [OperationHoursService],
})
export class OperationHoursModule {}
