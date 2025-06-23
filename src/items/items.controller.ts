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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.itemsService.getCount();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(@Body() createItemDto: CreateItemDto, @Request() req) {
    return this.itemsService.create(createItemDto, req.user.id);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('availability') availability?: string,
    @Query('visibility') visibility?: string,
    @Query('is_favourite') is_favourite?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const availabilityBool =
      availability === 'true'
        ? true
        : availability === 'false'
          ? false
          : undefined;
    const visibilityBool =
      visibility === 'true' ? true : visibility === 'false' ? false : undefined;
    const isFavouriteBool =
      is_favourite === 'true'
        ? true
        : is_favourite === 'false'
          ? false
          : undefined;

    return this.itemsService.findAll(
      pageNum,
      limitNum,
      search,
      categoryId,
      availabilityBool,
      visibilityBool,
      isFavouriteBool,
    );
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req,
  ) {
    return this.itemsService.update(id, updateItemDto, req.user.id);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
