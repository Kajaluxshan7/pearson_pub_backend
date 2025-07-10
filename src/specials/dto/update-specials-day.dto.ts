import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecialsDayDto } from './create-specials-day.dto';

export class UpdateSpecialsDayDto extends PartialType(CreateSpecialsDayDto) {}
