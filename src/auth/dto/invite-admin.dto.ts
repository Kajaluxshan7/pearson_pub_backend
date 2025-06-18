import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { AdminRole } from '../../admins/entities/admin.entity';

export class InviteAdminDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole = AdminRole.ADMIN;
}
