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
import { SpecialsService } from './specials.service';
import { CreateSpecialDto } from './dto/create-special.dto';
import { UpdateSpecialDto } from './dto/update-special.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('specials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialsController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createSpecialDto: CreateSpecialDto) {
    return this.specialsService.create(createSpecialDto);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('specialType') specialType?: string,
  ) {
    return this.specialsService.findAll(page, limit, search, specialType);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialDto: UpdateSpecialDto,
  ) {
    return this.specialsService.update(id, updateSpecialDto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialsService.remove(id);
  }
}
