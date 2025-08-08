import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  
  story_name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsUUID()
  @IsOptional()
  lastEditedByAdminId?: string;

  // For removing individual existing images during update
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  removeImages?: string[];

  // For keeping specific existing images during update
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  existingImages?: string[];
}
