import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddonsService } from './addons.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('addons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.addonsService.getCount();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async create(@Body() createAddonDto: CreateAddonDto, @Request() req) {
    try {
      console.log('🔄 Addons Controller - Create request:', createAddonDto);
      const result = await this.addonsService.create(
        createAddonDto,
        req.user.id,
      );
      console.log('✅ Addons Controller - Create successful');
      return result;
    } catch (error) {
      console.error('❌ Addons Controller - Create error:', error);
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('itemId') itemId?: string,
    @Query('category_type') categoryType?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.addonsService.findAll(
      pageNum,
      limitNum,
      search,
      itemId,
      categoryType,
    );
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.addonsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAddonDto: UpdateAddonDto,
    @Request() req,
  ) {
    return this.addonsService.update(id, updateAddonDto, req.user.id);
  }
  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    try {
      console.log('🔄 Addons Controller - Delete request for ID:', id);
      await this.addonsService.remove(id);
      console.log('✅ Addons Controller - Delete successful');
      return { message: 'Addon deleted successfully' };
    } catch (error) {
      console.error('❌ Addons Controller - Delete error:', error);
      throw error;
    }
  }

  @Post(':id/duplicate')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  duplicate(@Param('id') id: string, @Request() req) {
    return this.addonsService.duplicate(id, req.user.id);
  }
}
