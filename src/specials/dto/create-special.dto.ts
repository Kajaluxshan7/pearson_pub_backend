import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { SpecialTypeEnum } from '../../common/enums';

export class CreateSpecialDto {
  @IsEnum(SpecialTypeEnum)
  @IsNotEmpty()
  special_type: SpecialTypeEnum;

  @ValidateIf((o) => o.special_type === 'daily')
  @IsUUID()
  @IsNotEmpty()
  specialsDayId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsOptional()
  from_menu?: boolean;

  @IsUUID()
  @IsOptional()
  menuItemId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ValidateIf(
    (o) => o.special_type === 'seasonal' || o.special_type === 'latenight',
  )
  @IsDateString()
  @IsNotEmpty()
  seasonal_start_date?: Date;

  @ValidateIf(
    (o) => o.special_type === 'seasonal' || o.special_type === 'latenight',
  )
  @IsDateString()
  @IsOptional()
  seasonal_end_date?: Date;

  @IsUUID()
  @IsNotEmpty()
  lastEditedByAdminId: string;
}
