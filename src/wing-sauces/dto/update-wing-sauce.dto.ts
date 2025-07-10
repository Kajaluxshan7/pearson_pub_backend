import { PartialType } from '@nestjs/mapped-types';
import { CreateWingSauceDto } from './create-wing-sauce.dto';

export class UpdateWingSauceDto extends PartialType(CreateWingSauceDto) {}
