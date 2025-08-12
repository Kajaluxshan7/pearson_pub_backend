import { Controller, Get, Param } from '@nestjs/common';
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

  @Get('stories/:id')
  async getStoryById(@Param('id') id: string) {
    console.error('🔍 CONTROLLER METHOD CALLED - Story ID:', id);
    console.error('🔍 Request received at:', new Date().toISOString());
    try {
      const result = await this.publicApiService.getStoryById(id);
      console.error('🔍 Service call successful');
      return result;
    } catch (error) {
      console.error('🔍 Service call failed:', error);
      throw error;
    }
  }

  @Get('operation-hours')
  async getOperationHours() {
    console.error('🔥 OPERATION HOURS DEBUG TEST - This should appear in logs');
    return this.publicApiService.getOperationHours();
  }

  @Get('operation-hours/status')
  async getTodayOperationStatus() {
    return this.publicApiService.getTodayOperationStatus();
  }
}
