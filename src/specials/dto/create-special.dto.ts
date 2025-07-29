import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SpecialTypeEnum } from '../../common/enums';

export class CreateSpecialDto {
  @IsEnum(SpecialTypeEnum)
  @IsNotEmpty()
  special_type: SpecialTypeEnum;

  // For daily specials - weekday required
  @ValidateIf((o) => o.special_type === 'daily')
  @IsUUID()
  @IsNotEmpty()
  specialsDayId?: string;

  // For seasonal specials - season name required
  @ValidateIf((o) => o.special_type === 'seasonal')
  @IsString()
  @IsNotEmpty()
  season_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsOptional()
  image_urls?: string[];

  // For seasonal specials - start datetime required
  @ValidateIf((o) => o.special_type === 'seasonal')
  @IsDateString()
  @IsNotEmpty()
  seasonal_start_datetime?: Date;

  // For seasonal specials - end datetime required
  @ValidateIf((o) => o.special_type === 'seasonal')
  @IsDateString()
  @IsNotEmpty()
  seasonal_end_datetime?: Date;

  @IsUUID()
  @IsOptional()
  lastEditedByAdminId?: string;

  // For removing individual existing images during update
  @IsOptional()
  removeImages?: string[];

  // For keeping specific existing images during update
  @IsOptional()
  existingImages?: string[];
}
