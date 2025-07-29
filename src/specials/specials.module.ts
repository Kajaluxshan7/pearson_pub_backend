import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialsService } from './specials.service';
import { SpecialsController } from './specials.controller';
import { SpecialsDayService } from './specials-day.service';
import { SpecialsDayController } from './specials-day.controller';
import { Special } from './entities/special.entity';
import { SpecialsDay } from './entities/specials-day.entity';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Special, SpecialsDay])],
  controllers: [SpecialsController, SpecialsDayController],
  providers: [SpecialsService, SpecialsDayService, FileUploadService],
  exports: [SpecialsService, SpecialsDayService],
})
export class SpecialsModule {}
