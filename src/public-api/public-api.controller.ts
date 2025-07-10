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
}
