import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { SpecialTypeEnum } from '../../common/enums';

export class CreateSpecialDto {
  @IsEnum(SpecialTypeEnum)
  @IsNotEmpty()
  special_type!: SpecialTypeEnum;

  // For daily specials - weekday required
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => o.special_type === 'daily')
  @IsUUID()
  @IsNotEmpty()
  specialsDayId?: string;

  // For seasonal specials - season name required
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => o.special_type === 'seasonal')
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => o.special_type === 'seasonal')
  @IsDateString()
  @IsNotEmpty()
  seasonal_start_datetime?: Date;

  // For seasonal specials - end datetime required
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => o.special_type === 'seasonal')
  @IsDateString()
  @IsNotEmpty()
  seasonal_end_datetime?: Date;

  // Display start time - optional, controls when special is visible to users
  @IsDateString()
  @IsOptional()
  display_start_time?: Date;

  // Display end time - optional, controls when special stops being visible to users
  @IsDateString()
  @IsOptional()
  display_end_time?: Date;

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
