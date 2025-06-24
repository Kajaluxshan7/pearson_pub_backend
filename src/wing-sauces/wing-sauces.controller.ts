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
import { WingSaucesService } from './wing-sauces.service';
import { CreateWingSauceDto } from './dto/create-wing-sauce.dto';
import { UpdateWingSauceDto } from './dto/update-wing-sauce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('wing-sauces')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WingSaucesController {
  constructor(private readonly wingSaucesService: WingSaucesService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createWingSauceDto: CreateWingSauceDto) {
    return this.wingSaucesService.create(createWingSauceDto);
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
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWingSauceDto: UpdateWingSauceDto,
  ) {
    return this.wingSaucesService.update(id, updateWingSauceDto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.wingSaucesService.remove(id);
  }
}
