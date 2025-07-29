import { Controller, Get } from '@nestjs/common';
import { PublicApiService } from './public-api.service';

@Controller('api/public')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('landing-content')
  async getLandingPageContent() {
    return this.publicApiService.getLandingPageContent();
  }

  @Get('menu')
  async getMenuData() {
    return this.publicApiService.getMenuData();
  }

  @Get('events')
  async getEventsData() {
    return this.publicApiService.getEventsData();
  }

  @Get('contact')
  async getContactInfo() {
    return this.publicApiService.getContactInfo();
  }

  @Get('specials')
  async getSpecials() {
    return this.publicApiService.getSpecialsData();
  }

  @Get('specials/daily')
  async getDailySpecials() {
    return this.publicApiService.getDailySpecials();
  }

  @Get('specials/seasonal')
  async getSeasonalSpecials() {
    return this.publicApiService.getSeasonalSpecials();
  }

  @Get('specials/latenight')
  async getLateNightSpecials() {
    return this.publicApiService.getLateNightSpecials();
  }

  @Get('stories')
  async getStories() {
    return this.publicApiService.getStoriesData();
  }
}
