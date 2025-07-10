import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationHoursService } from './operation-hours.service';
import { OperationHoursController } from './operation-hours.controller';
import { OperationHour } from './entities/operation-hour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OperationHour])],
  controllers: [OperationHoursController],
  providers: [OperationHoursService],
  exports: [OperationHoursService],
})
export class OperationHoursModule {}
