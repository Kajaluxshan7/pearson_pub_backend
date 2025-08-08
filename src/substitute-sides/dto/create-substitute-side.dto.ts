import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateSubstituteSideDto {
  @IsString()
  @IsNotEmpty()
  
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  
  price!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  lastEditedByAdminId?: string;
}
