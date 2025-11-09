import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderItemsDto {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  itemIds!: string[];
}
