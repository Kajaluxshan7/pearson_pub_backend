import { IsEnum, IsNotEmpty } from 'class-validator';
import { DaysOfWeekEnum } from '../../common/enums';

export class CreateSpecialsDayDto {
  @IsEnum(DaysOfWeekEnum)
  @IsNotEmpty()
  day_name: DaysOfWeekEnum;
}
