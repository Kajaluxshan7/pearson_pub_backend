import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ItemSize } from '../entities/item.entity';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  original_price: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];

  @IsArray()
  @IsOptional()
  @IsEnum(ItemSize, { each: true })
  sizes?: ItemSize[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsBoolean()
  @IsOptional()
  availability?: boolean;

  @IsBoolean()
  @IsOptional()
  visibility?: boolean;

  @IsBoolean()
  @IsOptional()
  is_favourite?: boolean;
}
