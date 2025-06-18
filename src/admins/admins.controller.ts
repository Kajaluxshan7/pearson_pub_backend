import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from './entities/admin.entity';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @Roles(AdminRole.SUPERADMIN)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  @Get()
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  findAll() {
    return this.adminsService.findAll();
  }

  @Get(':id')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.adminsService.remove(id);
  }
}
