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
import { OperationHoursService } from './operation-hours.service';
import { CreateOperationHourDto } from './dto/create-operation-hour.dto';
import { UpdateOperationHourDto } from './dto/update-operation-hour.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';
import { DayOfWeek } from './entities/operation-hour.entity';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { LoggerService } from '../common/logger/logger.service';

@Controller('operation-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationHoursController {
  private readonly logger = new LoggerService(OperationHoursController.name);

  constructor(private readonly operationHoursService: OperationHoursService) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.operationHoursService.getCount();
  }

  @Get('status')
  getCurrentStatus() {
    return this.operationHoursService.getCurrentOperationStatus();
  }

  @Get('with-status')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getAllWithStatus() {
    return this.operationHoursService.getAllWithStatus();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async create(
    @Body() createOperationHourDto: CreateOperationHourDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      this.logger.log(
        `🔄 Create request: ${JSON.stringify(createOperationHourDto)}`,
      );
      const result = await this.operationHoursService.create(
        createOperationHourDto,
        req.user.id,
      );
      this.logger.log('✅ Create successful');
      return result;
    } catch (error: any) {
      this.logger.error('❌ Create error:', error?.message || error);
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('day') day?: DayOfWeek,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.operationHoursService.findAll(pageNum, limitNum, day);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.operationHoursService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateOperationHourDto: UpdateOperationHourDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      this.logger.log(
        `🔄 Update request: ${JSON.stringify({ id, updateOperationHourDto })}`,
      );
      const result = await this.operationHoursService.update(
        id,
        updateOperationHourDto,
        req.user.id,
      );
      this.logger.log('✅ Update successful');
      return result;
    } catch (error: any) {
      this.logger.error('❌ Update error:', error?.message || error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`🔄 Delete request for ID: ${id}`);
      await this.operationHoursService.remove(id);
      this.logger.log('✅ Delete successful');
      return { message: 'Operation hour deleted successfully' };
    } catch (error: any) {
      this.logger.error('❌ Delete error:', error?.message || error);
      throw error;
    }
  }
}
