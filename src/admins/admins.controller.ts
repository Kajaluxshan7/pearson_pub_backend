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
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from './entities/admin.entity';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  private readonly logger = new Logger(AdminsController.name);

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
  findAll(@Request() req: AuthenticatedRequest) {
    return this.adminsService.findAll(req.user.role);
  }

  @Get('filtered')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  getAllWithFilters(
    @Request() req: AuthenticatedRequest,
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

  @Patch('profile')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  updateProfile(
    @Body() updateAdminDto: UpdateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminsService.updateProfile(req.user.id, updateAdminDto);
  }

  @Post('profile/avatar')
  @Roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminsService.uploadAvatar(req.user.id, file);
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
    @Request() req: AuthenticatedRequest,
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
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    try {
      this.logger.log(`Delete request for admin ID: ${id}`);
      await this.adminsService.remove(id, req.user.role);
      this.logger.log(`Admin deleted successfully: ${id}`);
      return { message: 'Admin deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Delete error for admin ID ${id}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  @Patch(':id/toggle-status')
  @Roles(AdminRole.SUPERADMIN)
  toggleStatus(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.adminsService.toggleStatus(id, req.user.id, req.user.role);
  }
}
