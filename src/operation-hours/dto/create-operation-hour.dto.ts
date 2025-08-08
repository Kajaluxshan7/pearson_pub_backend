import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { DayOfWeek } from '../entities/operation-hour.entity';

export class CreateOperationHourDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day!: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  
  open_time!: string;

  @IsString()
  @IsNotEmpty()
  
  close_time!: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
