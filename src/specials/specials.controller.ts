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
  async create(@Body() createSpecialDto: CreateSpecialDto, @Request() req) {
    try {
      console.log('🔄 Specials Controller - Create request:', createSpecialDto);
      const result = await this.specialsService.create(
        createSpecialDto,
        req.user.id,
      );
      console.log('✅ Specials Controller - Create successful');
      return result;
    } catch (error) {
      console.error('❌ Specials Controller - Create error:', error);
      throw error;
    }
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialDto: UpdateSpecialDto,
    @Request() req,
  ) {
    try {
      console.log('🔄 Specials Controller - Update request:', {
        id,
        updateSpecialDto,
      });
      const result = await this.specialsService.update(
        id,
        updateSpecialDto,
        req.user.id,
      );
      console.log('✅ Specials Controller - Update successful');
      return result;
    } catch (error) {
      console.error('❌ Specials Controller - Update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      console.log('🔄 Specials Controller - Delete request for ID:', id);
      await this.specialsService.remove(id);
      console.log('✅ Specials Controller - Delete successful');
      return { message: 'Special deleted successfully' };
    } catch (error) {
      console.error('❌ Specials Controller - Delete error:', error);
      throw error;
    }
  }
}
