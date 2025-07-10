import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { ItemsService } from '../items/items.service';
import { EventsService } from '../events/events.service';
import { OperationHoursService } from '../operation-hours/operation-hours.service';
import { SpecialsService } from '../specials/specials.service';

export interface LandingPageContent {
  categories: any[];
  featuredItems: any[];
  allItems: any[];
  upcomingEvents: any[];
  todaysSpecials: any[];
  operationHours: any[];
  siteInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    description: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
}

@Injectable()
export class PublicApiService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly eventsService: EventsService,
    private readonly operationHoursService: OperationHoursService,
    private readonly specialsService: SpecialsService,
  ) {}

  async getLandingPageContent(): Promise<LandingPageContent> {
    try {
      // Fetch all necessary data in parallel
      const [
        categoriesResponse,
        featuredItemsResponse,
        allItemsResponse,
        eventsResponse,
        specialsResponse,
        operationHoursResponse,
      ] = await Promise.all([
        this.categoriesService.findAll(1, 50), // Get all categories
        this.itemsService.findAll(
          1,
          20,
          undefined,
          undefined,
          undefined,
          true,
          true,
        ), // Featured & visible items
        this.itemsService.findAll(1, 100, undefined, undefined, true, true), // All available & visible items
        this.eventsService.findAll(1, 10), // Upcoming events
        this.specialsService.findAll(1, 20), // Today's specials
        this.operationHoursService.findAll(1, 10), // Operation hours
      ]);

      return {
        categories: categoriesResponse.data,
        featuredItems: featuredItemsResponse.data,
        allItems: allItemsResponse.data,
        upcomingEvents: eventsResponse.data,
        todaysSpecials: specialsResponse.data,
        operationHours: operationHoursResponse.data,
        siteInfo: {
          name: 'The Pearson Pub',
          phone: '905-430-5699',
          email: 'info@thepearsonpub.com',
          address: '5179 Dundas Street W, Etobicoke, ON M9A 1C2',
          description:
            'A cozy neighborhood pub offering great food, drinks, and entertainment.',
          socialMedia: {
            facebook: 'https://facebook.com/thepearsonpub',
            instagram: 'https://instagram.com/thepearsonpub',
            twitter: 'https://twitter.com/thepearsonpub',
          },
        },
      };
    } catch (error) {
      console.error('Error fetching landing page content:', error);
      throw new Error('Failed to fetch landing page content');
    }
  }

  async getMenuData() {
    try {
      const [categoriesResponse, itemsResponse] = await Promise.all([
        this.categoriesService.findAll(1, 50),
        this.itemsService.findAll(1, 200, undefined, undefined, true, true), // All available & visible items
      ]);

      // Group items by category
      const categoriesWithItems = categoriesResponse.data.map((category) => ({
        ...category,
        items: itemsResponse.data.filter(
          (item) => item.categoryId === category.id,
        ),
      }));

      return {
        categories: categoriesWithItems,
        totalItems: itemsResponse.total,
      };
    } catch (error) {
      console.error('Error fetching menu data:', error);
      throw new Error('Failed to fetch menu data');
    }
  }

  async getEventsData() {
    try {
      const eventsResponse = await this.eventsService.findAll(1, 50);
      return {
        events: eventsResponse.data,
        total: eventsResponse.total,
      };
    } catch (error) {
      console.error('Error fetching events data:', error);
      throw new Error('Failed to fetch events data');
    }
  }

  async getContactInfo() {
    try {
      const operationHoursResponse = await this.operationHoursService.findAll(
        1,
        10,
      );

      return {
        name: 'The Pearson Pub',
        phone: '905-430-5699',
        email: 'info@thepearsonpub.com',
        address: '5179 Dundas Street W, Etobicoke, ON M9A 1C2',
        operationHours: operationHoursResponse.data,
        socialMedia: {
          facebook: 'https://facebook.com/thepearsonpub',
          instagram: 'https://instagram.com/thepearsonpub',
          twitter: 'https://twitter.com/thepearsonpub',
        },
        mapCoordinates: {
          lat: 43.6426,
          lng: -79.3871,
        },
      };
    } catch (error) {
      console.error('Error fetching contact info:', error);
      throw new Error('Failed to fetch contact info');
    }
  }
}
