import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { ItemsService } from '../items/items.service';
import { EventsService } from '../events/events.service';
import { OperationHoursService } from '../operation-hours/operation-hours.service';
import { SpecialsService } from '../specials/specials.service';
import { StoriesService } from '../stories/stories.service';

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
    private readonly storiesService: StoriesService,
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
        this.categoriesService.findAll(1, 1000), // Get all categories
        this.itemsService.findAll(
          1,
          20,
          undefined,
          undefined,
          undefined,
          true,
          true,
        ), // Featured & visible items
        this.itemsService.findAll(1, 10000, undefined, undefined, true, true), // All available & visible items
        this.eventsService.findAll(1, 100), // Fetch more events
        this.specialsService.findAll(1, 100), // Today's specials
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
        this.categoriesService.findAll(1, 1000), // Increase categories limit
        this.itemsService.findAll(
          1,
          10000,
          undefined,
          undefined,
          undefined,
          true,
        ), // Fetch all visible items (both available and unavailable)
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
      const eventsResponse = await this.eventsService.findAll(1, 1000); // Fetch more events
      
      // Helper function to format date to readable format
      const formatDate = (date: Date | string): string => {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };

      // Helper function to calculate event status
      const calculateEventStatus = (startDate: Date | string, endDate: Date | string): string => {
        const now = new Date();
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        
        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'current';
        return 'ended';
      };
      
      // Map events data to clean public API format with status calculation
      const events = eventsResponse.data.map(event => {
        const status = calculateEventStatus(event.start_date, event.end_date);

        return {
          id: event.id,
          name: event.name,
          title: event.name, // Add title for frontend compatibility
          description: event.description,
          images: event.images || [],
          image: event.images && event.images.length > 0 ? event.images[0] : null,
          start_date: event.start_date,
          end_date: event.end_date,
          startDate: formatDate(event.start_date), // Formatted date for frontend
          endDate: formatDate(event.end_date), // Formatted date for frontend
          status: status,
          category: 'event', // Default category
          featured: false, // Default featured status
          price: {}, // Default empty price object
          location: 'The Pearson Pub', // Default location
          created_at: event.created_at,
          updated_at: event.updated_at,
        };
      });

      return {
        events,
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

  async getSpecialsData() {
    try {
      const specialsResponse = await this.specialsService.findAll(1, 50);
      return {
        specials: specialsResponse.data,
        total: specialsResponse.total,
      };
    } catch (error) {
      console.error('Error fetching specials data:', error);
      throw new Error('Failed to fetch specials data');
    }
  }

  async getDailySpecials() {
    try {
      const currentDayName = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
      });
      
      console.log('🔍 Current day name:', currentDayName);
      
      const specialsResponse = await this.specialsService.findAll(
        1,
        50,
        undefined,
        'daily',
      );

      console.log('🔍 All daily specials found:', specialsResponse.data.length);
      console.log('🔍 Daily specials details:', specialsResponse.data.map(s => ({
        id: s.id,
        day_name: s.specialsDay?.day_name,
        special_type: s.special_type
      })));

      // Filter daily specials for current day - make comparison case-insensitive
      const todaySpecials = specialsResponse.data.filter(
        (special: any) => {
          const specialDayName = special.specialsDay?.day_name;
          if (!specialDayName) return false;
          
          // Case-insensitive comparison
          return specialDayName.toLowerCase() === currentDayName.toLowerCase();
        }
      );

      console.log('🔍 Today specials filtered:', todaySpecials.length);

      return {
        specials: todaySpecials,
        dayName: currentDayName,
        heading: `${currentDayName} Special`,
        total: todaySpecials.length,
      };
    } catch (error) {
      console.error('Error fetching daily specials:', error);
      throw new Error('Failed to fetch daily specials');
    }
  }

  async getSeasonalSpecials() {
    try {
      const specialsResponse = await this.specialsService.findAll(
        1,
        50,
        undefined,
        'seasonal',
      );

      // Filter seasonal specials that are currently active
      const currentDate = new Date();
      const activeSeasonalSpecials = specialsResponse.data.filter(
        (special: any) => {
          if (!special.seasonal_start_datetime || !special.seasonal_end_datetime) {
            return false;
          }
          const startDate = new Date(special.seasonal_start_datetime);
          const endDate = new Date(special.seasonal_end_datetime);
          return currentDate >= startDate && currentDate <= endDate;
        },
      );

      return {
        specials: activeSeasonalSpecials.map((special: any) => ({
          ...special,
          heading: special.season_name || 'Seasonal Special',
        })),
        total: activeSeasonalSpecials.length,
      };
    } catch (error) {
      console.error('Error fetching seasonal specials:', error);
      throw new Error('Failed to fetch seasonal specials');
    }
  }

  async getLateNightSpecials() {
    try {
      const specialsResponse = await this.specialsService.findAll(
        1,
        50,
        undefined,
        'latenight',
      );

      return {
        specials: specialsResponse.data.map((special: any) => ({
          ...special,
          heading: 'Latenight Special',
        })),
        heading: 'Latenight Special',
        total: specialsResponse.data.length,
      };
    } catch (error) {
      console.error('Error fetching latenight specials:', error);
      throw new Error('Failed to fetch latenight specials');
    }
  }

  async getStoriesData(): Promise<{
    stories: any[];
    total: number;
  }> {
    try {
      // Get all stories for public display
      const storiesResponse = await this.storiesService.findAll(1, 50);

      return {
        stories: storiesResponse.data.map((story: any) => ({
          id: story.id,
          title: story.story_name,
          description: story.description,
          images: story.images || [],
          image: story.images?.[0] || null, // First image as the main image
          created_at: story.created_at,
          updated_at: story.updated_at,
        })),
        total: storiesResponse.total,
      };
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw new Error('Failed to fetch stories');
    }
  }
}
