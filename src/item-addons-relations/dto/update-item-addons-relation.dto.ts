import { PartialType } from '@nestjs/mapped-types';
import { CreateItemAddonsRelationDto } from './create-item-addons-relation.dto';

export class UpdateItemAddonsRelationDto extends PartialType(
  CreateItemAddonsRelationDto,
) {}
