import { PartialType } from '@nestjs/mapped-types';
import { CreateSubstituteSideDto } from './create-substitute-side.dto';

export class UpdateSubstituteSideDto extends PartialType(
  CreateSubstituteSideDto,
) {}
