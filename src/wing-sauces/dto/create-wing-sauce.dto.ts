import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateWingSauceDto {
  @IsString()
  @IsNotEmpty()
  
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  lastEditedByAdminId?: string;
}
