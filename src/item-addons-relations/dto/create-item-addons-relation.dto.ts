import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateItemAddonsRelationDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  addonId: string;
}
