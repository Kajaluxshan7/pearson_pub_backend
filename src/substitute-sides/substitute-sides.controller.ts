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
import { SubstituteSidesService } from './substitute-sides.service';
import { CreateSubstituteSideDto } from './dto/create-substitute-side.dto';
import { UpdateSubstituteSideDto } from './dto/update-substitute-side.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('substitute-sides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubstituteSidesController {
  constructor(
    private readonly substituteSidesService: SubstituteSidesService,
  ) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createSubstituteSideDto: CreateSubstituteSideDto) {
    return this.substituteSidesService.create(createSubstituteSideDto);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.substituteSidesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.substituteSidesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubstituteSideDto: UpdateSubstituteSideDto,
  ) {
    return this.substituteSidesService.update(id, updateSubstituteSideDto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.substituteSidesService.remove(id);
  }
}
