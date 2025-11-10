import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WingSaucesService } from './wing-sauces.service';
import { CreateWingSauceDto } from './dto/create-wing-sauce.dto';
import { UpdateWingSauceDto } from './dto/update-wing-sauce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { AdminRole } from '../admins/entities/admin.entity';
import { LoggerService } from '../common/logger/logger.service';

@Controller('wing-sauces')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WingSaucesController {
  private readonly logger = new LoggerService(WingSaucesController.name);

  constructor(private readonly wingSaucesService: WingSaucesService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async create(
    @Body() createWingSauceDto: CreateWingSauceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      this.logger.log(
        `🔄 WingSauces Controller - Create request: ${JSON.stringify(createWingSauceDto)}`,
      );
      const result = await this.wingSaucesService.create(
        createWingSauceDto,
        req.user.id,
      );
      this.logger.log('✅ WingSauces Controller - Create successful');
      return result;
    } catch (error: any) {
      this.logger.error(
        '❌ WingSauces Controller - Create error:',
        error?.message || error,
      );
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.wingSaucesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.wingSaucesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWingSauceDto: UpdateWingSauceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      this.logger.log(
        `🔄 WingSauces Controller - Update request: ${JSON.stringify({ id, updateWingSauceDto })}`,
      );
      const result = await this.wingSaucesService.update(
        id,
        updateWingSauceDto,
        req.user.id,
      );
      this.logger.log('✅ WingSauces Controller - Update successful');
      return result;
    } catch (error: any) {
      this.logger.error(
        '❌ WingSauces Controller - Update error:',
        error?.message || error,
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(
        `🔄 WingSauces Controller - Delete request for ID: ${id}`,
      );
      await this.wingSaucesService.remove(id);
      this.logger.log('✅ WingSauces Controller - Delete successful');
      return { message: 'Wing sauce deleted successfully' };
    } catch (error: any) {
      this.logger.error(
        '❌ WingSauces Controller - Delete error:',
        error?.message || error,
      );
      throw error;
    }
  }
}
