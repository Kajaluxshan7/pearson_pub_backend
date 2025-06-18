import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { AdminRole } from '../entities/admin.entity';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
