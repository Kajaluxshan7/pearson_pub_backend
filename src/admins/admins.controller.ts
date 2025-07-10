import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
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

  @Get('count')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  getCount() {
    return this.adminsService.getCount();
  }

  @Post()
  @Roles(AdminRole.SUPERADMIN)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }
  @Get()
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  findAll(@Request() req) {
    return this.adminsService.findAll(req.user.role);
  }

  @Get('filtered')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  getAllWithFilters(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('role') role?: AdminRole,
    @Query('status') status?: string,
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status !== undefined) filters.status = status === 'true';

    return this.adminsService.getAllWithFilters(
      parseInt(page),
      parseInt(limit),
      req.user.role,
      filters,
    );
  }

  @Get(':id')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }
  @Patch(':id')
  @Roles(AdminRole.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Request() req,
  ) {
    return this.adminsService.update(
      id,
      updateAdminDto,
      req.user.id,
      req.user.role,
    );
  }
  @Delete(':id')
  @Roles(AdminRole.SUPERADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.adminsService.remove(id, req.user.role);
  }

  @Patch(':id/toggle-status')
  @Roles(AdminRole.SUPERADMIN)
  toggleStatus(@Param('id') id: string, @Request() req) {
    return this.adminsService.toggleStatus(id, req.user.id, req.user.role);
  }
}
