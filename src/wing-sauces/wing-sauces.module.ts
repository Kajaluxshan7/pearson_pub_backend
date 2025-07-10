import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WingSaucesService } from './wing-sauces.service';
import { WingSaucesController } from './wing-sauces.controller';
import { WingSauce } from './entities/wing-sauce.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WingSauce])],
  controllers: [WingSaucesController],
  providers: [WingSaucesService],
  exports: [WingSaucesService],
})
export class WingSaucesModule {}
