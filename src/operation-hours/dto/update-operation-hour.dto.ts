import { PartialType } from '@nestjs/mapped-types';
import { CreateOperationHourDto } from './create-operation-hour.dto';

export class UpdateOperationHourDto extends PartialType(
  CreateOperationHourDto,
) {}
