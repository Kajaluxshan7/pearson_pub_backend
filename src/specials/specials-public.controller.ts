import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { SpecialsService } from './specials.service';

@Controller('public/specials')
export class SpecialsPublicController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Get()
  findAllPublic(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('specialType') specialType?: string,
  ) {
    return this.specialsService.findAll(page, limit, search, specialType);
  }
}
