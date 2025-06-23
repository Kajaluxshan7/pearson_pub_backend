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

@Controller('operation-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationHoursController {
  constructor(private readonly operationHoursService: OperationHoursService) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.operationHoursService.getCount();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(
    @Body() createOperationHourDto: CreateOperationHourDto,
    @Request() req,
  ) {
    return this.operationHoursService.create(
      createOperationHourDto,
      req.user.id,
    );
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
  update(
    @Param('id') id: string,
    @Body() updateOperationHourDto: UpdateOperationHourDto,
    @Request() req,
  ) {
    return this.operationHoursService.update(
      id,
      updateOperationHourDto,
      req.user.id,
    );
  }
  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.operationHoursService.remove(id);
  }
}
