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
  async create(
    @Body() createSubstituteSideDto: CreateSubstituteSideDto,
    @Request() req,
  ) {
    try {
      console.log(
        '🔄 SubstituteSides Controller - Create request:',
        createSubstituteSideDto,
      );
      const result = await this.substituteSidesService.create(
        createSubstituteSideDto,
        req.user.id,
      );
      console.log('✅ SubstituteSides Controller - Create successful');
      return result;
    } catch (error) {
      console.error('❌ SubstituteSides Controller - Create error:', error);
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
    return this.substituteSidesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.substituteSidesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubstituteSideDto: UpdateSubstituteSideDto,
    @Request() req,
  ) {
    try {
      console.log('🔄 SubstituteSides Controller - Update request:', {
        id,
        updateSubstituteSideDto,
      });
      const result = await this.substituteSidesService.update(
        id,
        updateSubstituteSideDto,
        req.user.id,
      );
      console.log('✅ SubstituteSides Controller - Update successful');
      return result;
    } catch (error) {
      console.error('❌ SubstituteSides Controller - Update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      console.log('🔄 SubstituteSides Controller - Delete request for ID:', id);
      await this.substituteSidesService.remove(id);
      console.log('✅ SubstituteSides Controller - Delete successful');
      return { message: 'Substitute side deleted successfully' };
    } catch (error) {
      console.error('❌ SubstituteSides Controller - Delete error:', error);
      throw error;
    }
  }
}
