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
} from '@nestjs/common';
import { SpecialsDayService } from './specials-day.service';
import { CreateSpecialsDayDto } from './dto/create-specials-day.dto';
import { UpdateSpecialsDayDto } from './dto/update-specials-day.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('specials-day')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialsDayController {
  constructor(private readonly specialsDayService: SpecialsDayService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createSpecialsDayDto: CreateSpecialsDayDto) {
    return this.specialsDayService.create(createSpecialsDayDto);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.specialsDayService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialsDayService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialsDayDto: UpdateSpecialsDayDto,
  ) {
    return this.specialsDayService.update(id, updateSpecialsDayDto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialsDayService.remove(id);
  }
}
