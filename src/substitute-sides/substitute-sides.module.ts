import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubstituteSidesService } from './substitute-sides.service';
import { SubstituteSidesController } from './substitute-sides.controller';
import { SubstituteSide } from './entities/substitute-side.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubstituteSide])],
  controllers: [SubstituteSidesController],
  providers: [SubstituteSidesService],
  exports: [SubstituteSidesService],
})
export class SubstituteSidesModule {}
