import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemAddonsRelationsService } from './item-addons-relations.service';
import { ItemAddonsRelationsController } from './item-addons-relations.controller';
import { ItemAddonsRelation } from './entities/item-addons-relation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemAddonsRelation])],
  controllers: [ItemAddonsRelationsController],
  providers: [ItemAddonsRelationsService],
  exports: [ItemAddonsRelationsService],
})
export class ItemAddonsRelationsModule {}
