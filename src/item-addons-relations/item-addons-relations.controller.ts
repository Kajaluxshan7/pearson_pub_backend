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
import { ItemAddonsRelationsService } from './item-addons-relations.service';
import { CreateItemAddonsRelationDto } from './dto/create-item-addons-relation.dto';
import { UpdateItemAddonsRelationDto } from './dto/update-item-addons-relation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('item-addons-relations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemAddonsRelationsController {
  constructor(
    private readonly itemAddonsRelationsService: ItemAddonsRelationsService,
  ) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createItemAddonsRelationDto: CreateItemAddonsRelationDto) {
    return this.itemAddonsRelationsService.create(createItemAddonsRelationDto);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('itemId') itemId?: string,
    @Query('addonId') addonId?: string,
  ) {
    return this.itemAddonsRelationsService.findAll(
      page,
      limit,
      itemId,
      addonId,
    );
  }

  @Get('by-item/:itemId')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findByItemId(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.itemAddonsRelationsService.findByItemId(itemId);
  }

  @Get('by-addon/:addonId')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findByAddonId(@Param('addonId', ParseUUIDPipe) addonId: string) {
    return this.itemAddonsRelationsService.findByAddonId(addonId);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemAddonsRelationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemAddonsRelationDto: UpdateItemAddonsRelationDto,
  ) {
    return this.itemAddonsRelationsService.update(
      id,
      updateItemAddonsRelationDto,
    );
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemAddonsRelationsService.remove(id);
  }
}
