import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../modules/categories/categories.service';
import { ItemsService } from '../items/items.service';
import { EventsService } from '../events/events.service';
import { OperationHoursService } from '../operation-hours/operation-hours.service';
import { SpecialsService } from '../specials/specials.service';
import { StoriesService } from '../stories/stories.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { TimezoneService } from '../common/services/timezone.service';
import { LoggerService } from '../common/logger/logger.service';

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
      tiktok?: string;
    };
  };
}

@Injectable()
export class PublicApiService {
  private readonly logger = new LoggerService(PublicApiService.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly eventsService: EventsService,
    private readonly operationHoursService: OperationHoursService,
    private readonly specialsService: SpecialsService,
    private readonly storiesService: StoriesService,
    private readonly fileUploadService: FileUploadService,
    private readonly timezoneService: TimezoneService,
  ) {}

  // Helper method to generate signed URLs for images
  private async getSignedImagesUrls(images: string[]): Promise<string[]> {
    this.logger.log(
      `getSignedImagesUrls called with: ${JSON.stringify(images)}`,
    );
    this.logger.log(`Type of images parameter: ${typeof images}`);
    this.logger.log(`Is images an array?: ${Array.isArray(images)}`);

    if (!images || images.length === 0) {
      this.logger.log(
        'No images provided or empty array, returning empty array',
      );
      return [];
    }

    try {
      this.logger.log(
        `Calling fileUploadService.getMultipleSignedUrls with: ${JSON.stringify(images)}`,
      );
      const result = await this.fileUploadService.getMultipleSignedUrls(images);
      this.logger.log(
        `getMultipleSignedUrls returned: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        'Error in getSignedImagesUrls:',
        error?.message || error,
      );
      this.logger.error('Error stack:', error?.stack);
      this.logger.log(
        `Failed to generate signed URLs, returning original URLs: ${error?.message || error}`,
      );
      return images; // Fallback to original URLs
    }
  }

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

      // Generate signed URLs for featured items and all items
      const [
        featuredItemsWithSignedUrls,
        allItemsWithSignedUrls,
        eventsWithSignedUrls,
        specialsWithSignedUrls,
      ] = await Promise.all([
        Promise.all(
          featuredItemsResponse.data.map(async (item: any) => {
            const signedImages = await this.getSignedImagesUrls(
              item.images || [],
            );
            return { ...item, images: signedImages };
          }),
        ),
        Promise.all(
          allItemsResponse.data.map(async (item: any) => {
            const signedImages = await this.getSignedImagesUrls(
              item.images || [],
            );
            return { ...item, images: signedImages };
          }),
        ),
        Promise.all(
          eventsResponse.data.map(async (event: any) => {
            const signedImages = await this.getSignedImagesUrls(
              event.images || [],
            );
            return { ...event, images: signedImages };
          }),
        ),
        Promise.all(
          specialsResponse.data.map(async (special: any) => {
            const signedImages = await this.getSignedImagesUrls(
              special.image_urls || [],
            );
            return {
              ...special,
              image_urls: signedImages,
              image_url:
                signedImages && signedImages.length > 0
                  ? signedImages[0]
                  : special.image_url,
            };
          }),
        ),
      ]);

      return {
        categories: categoriesResponse.data,
        featuredItems: featuredItemsWithSignedUrls,
        allItems: allItemsWithSignedUrls,
        upcomingEvents: eventsWithSignedUrls,
        todaysSpecials: specialsWithSignedUrls,
        operationHours: operationHoursResponse.data,
        siteInfo: {
          name: 'The Pearson Pub',
          phone: '905-430-5699',
          email: 'thepearsonpub@rogers.com',
          address: '101 MARY ST WHITBY, ON, L1N 2R4',
          description:
            'A cozy neighborhood pub offering great food, drinks, and entertainment.',
          socialMedia: {
            facebook: 'https://www.facebook.com/thepearsonpubwhitby/',
            instagram:
              'https://www.instagram.com/the_pearson_pub?igsh=eWcycDhyN2wxN3Zz&utm_source=qr',
            tiktok:
              'https://www.tiktok.com/@the.pearson.pub6?_t=ZS-8yYnQOZpxEf&_r=1',
          },
        },
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching landing page content:',
        error?.message || error,
      );
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

      // Group items by category and generate signed URLs for images
      const categoriesWithItems = await Promise.all(
        categoriesResponse.data.map(async (category) => {
          const categoryItems = itemsResponse.data.filter(
            (item) => item.categoryId === category.id,
          );

          // Generate signed URLs for all item images in parallel
          const itemsWithSignedUrls = await Promise.all(
            categoryItems.map(async (item) => {
              const signedImages = await this.getSignedImagesUrls(item.images);
              return {
                ...item,
                images: signedImages,
              };
            }),
          );

          return {
            ...category,
            items: itemsWithSignedUrls,
          };
        }),
      );

      return {
        categories: categoriesWithItems,
        totalItems: itemsResponse.total,
      };
    } catch (error: any) {
      this.logger.error('Error fetching menu data:', error?.message || error);
      throw new Error('Failed to fetch menu data');
    }
  }

  async getEventsData() {
    try {
      const eventsResponse = await this.eventsService.findAll(1, 1000); // Fetch more events

      // Helper function to format date to readable format in Eastern Time
      const formatDate = (date: Date | string): string => {
        if (!date) return '';
        try {
          const dateObj = date instanceof Date ? date : new Date(date);
          return this.timezoneService.formatInEastern(dateObj, 'MMM dd, yyyy');
        } catch (error: any) {
          this.logger.log(`Error formatting date: ${error?.message || error}`);
          return '';
        }
      };

      // Helper function to calculate event status
      const calculateEventStatus = (
        startDate: Date | string,
        endDate: Date | string,
      ): string => {
        const now = this.timezoneService.getCurrentEasternTime();
        const start =
          startDate instanceof Date
            ? this.timezoneService.convertUtcToEastern(startDate)
            : this.timezoneService.convertUtcToEastern(new Date(startDate));
        const end =
          endDate instanceof Date
            ? this.timezoneService.convertUtcToEastern(endDate)
            : this.timezoneService.convertUtcToEastern(new Date(endDate));

        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'current';
        return 'ended';
      };

      // Map events data to clean public API format with timezone conversion and signed URLs
      const events = await Promise.all(
        eventsResponse.data.map(async (event) => {
          const status = calculateEventStatus(event.start_date, event.end_date);
          const signedImages = await this.getSignedImagesUrls(
            event.images || [],
          );

          // Convert UTC dates to Eastern Time for frontend
          const startDateEastern = this.timezoneService.convertUtcToEastern(
            event.start_date,
          );
          const endDateEastern = this.timezoneService.convertUtcToEastern(
            event.end_date,
          );

          return {
            id: event.id,
            name: event.name,
            title: event.name, // Add title for frontend compatibility
            description: event.description,
            images: signedImages,
            image:
              signedImages && signedImages.length > 0 ? signedImages[0] : null,
            start_date: event.start_date, // Original UTC date
            end_date: event.end_date, // Original UTC date
            start_date_eastern: startDateEastern, // Eastern Time Date object
            end_date_eastern: endDateEastern, // Eastern Time Date object
            startDate: formatDate(startDateEastern), // Formatted date for frontend
            endDate: formatDate(endDateEastern), // Formatted date for frontend
            startDateTime: this.timezoneService.formatDateTimeInEasternFriendly(
              event.start_date,
            ), // User-friendly datetime string (e.g., "Aug 9, 11 A.M")
            endDateTime: this.timezoneService.formatDateTimeInEasternFriendly(
              event.end_date,
            ), // User-friendly datetime string (e.g., "Aug 10, 2 A.M")
            timezone: this.timezoneService.getTimezoneInfo(event.start_date),
            status: status,
            category: 'event', // Default category
            featured: false, // Default featured status
            price: {}, // Default empty price object
            location: 'The Pearson Pub', // Default location
            created_at: event.created_at,
            updated_at: event.updated_at,
          };
        }),
      );

      return {
        events,
        total: eventsResponse.total,
      };
    } catch (error: any) {
      this.logger.error('Error fetching events data:', error?.message || error);
      throw new Error('Failed to fetch events data');
    }
  }

  async getContactInfo() {
    try {
      const operationHoursResponse = await this.operationHoursService.findAll(
        1,
        10,
      );
      const currentStatus =
        await this.operationHoursService.getCurrentOperationStatus();

      return {
        name: 'The Pearson Pub',
        phone: '905-430-5699',
        email: 'thepearsonpub@rogers.com',
        address: '101 MARY ST WHITBY, ON, L1N 2R4',
        operationHours: operationHoursResponse.data,
        currentStatus: currentStatus, // Added current opening status
        socialMedia: {
          facebook: 'https://www.facebook.com/thepearsonpubwhitby/',
          instagram: 'https://instagram.com/thepearsonpub',
          tiktok:
            'https://www.tiktok.com/@the.pearson.pub6?_t=ZS-8yYnQOZpxEf&_r=1',
        },
        mapCoordinates: {
          lat: 43.6426,
          lng: -79.3871,
        },
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching contact info:',
        error?.message || error,
      );
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
    } catch (error: any) {
      this.logger.error(
        'Error fetching specials data:',
        error?.message || error,
      );
      throw new Error('Failed to fetch specials data');
    }
  }

  async getDailySpecials() {
    try {
      const currentDayName = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
      });

      this.logger.log(`🔍 Current day name: ${currentDayName}`);

      const specialsResponse = await this.specialsService.findAll(
        1,
        50,
        undefined,
        'daily',
      );

      this.logger.log(
        `🔍 All daily specials found: ${specialsResponse.data.length}`,
      );
      this.logger.log(
        `🔍 Daily specials details: ${JSON.stringify(
          specialsResponse.data.map((s) => ({
            id: s.id,
            day_name: s.specialsDay?.day_name,
            special_type: s.special_type,
          })),
        )}`,
      );

      // Filter daily specials for current day - make comparison case-insensitive
      const todaySpecials = specialsResponse.data.filter((special: any) => {
        const specialDayName = special.specialsDay?.day_name;
        if (!specialDayName) return false;

        // Case-insensitive comparison
        return specialDayName.toLowerCase() === currentDayName.toLowerCase();
      });

      this.logger.log(`🔍 Today specials filtered: ${todaySpecials.length}`);

      // Generate signed URLs for specials images
      const todaySpecialsWithSignedUrls = await Promise.all(
        todaySpecials.map(async (special: any) => {
          const signedImages = await this.getSignedImagesUrls(
            special.image_urls || [],
          );
          return {
            ...special,
            image_urls: signedImages,
            image_url:
              signedImages && signedImages.length > 0
                ? signedImages[0]
                : special.image_url,
          };
        }),
      );

      return {
        specials: todaySpecialsWithSignedUrls,
        dayName: currentDayName,
        heading: `${currentDayName} Special`,
        total: todaySpecialsWithSignedUrls.length,
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching daily specials:',
        error?.message || error,
      );
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

      // Filter seasonal specials that are currently active and generate signed URLs
      const currentDate = new Date();
      const activeSeasonalSpecials = specialsResponse.data.filter(
        (special: any) => {
          if (
            !special.seasonal_start_datetime ||
            !special.seasonal_end_datetime
          ) {
            return false;
          }
          const startDate = new Date(special.seasonal_start_datetime);
          const endDate = new Date(special.seasonal_end_datetime);
          return currentDate >= startDate && currentDate <= endDate;
        },
      );

      // Generate signed URLs for seasonal specials images
      const seasonalSpecialsWithSignedUrls = await Promise.all(
        activeSeasonalSpecials.map(async (special: any) => {
          const signedImages = await this.getSignedImagesUrls(
            special.image_urls || [],
          );
          return {
            ...special,
            image_urls: signedImages,
            image_url:
              signedImages && signedImages.length > 0
                ? signedImages[0]
                : special.image_url,
            heading: special.season_name || 'Seasonal Special',
          };
        }),
      );

      return {
        specials: seasonalSpecialsWithSignedUrls,
        total: seasonalSpecialsWithSignedUrls.length,
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching seasonal specials:',
        error?.message || error,
      );
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

      // Generate signed URLs for late night specials images
      const lateNightSpecialsWithSignedUrls = await Promise.all(
        specialsResponse.data.map(async (special: any) => {
          const signedImages = await this.getSignedImagesUrls(
            special.image_urls || [],
          );
          return {
            ...special,
            image_urls: signedImages,
            image_url:
              signedImages && signedImages.length > 0
                ? signedImages[0]
                : special.image_url,
            heading: 'Latenight Special',
          };
        }),
      );

      return {
        specials: lateNightSpecialsWithSignedUrls,
        heading: 'Latenight Special',
        total: lateNightSpecialsWithSignedUrls.length,
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching latenight specials:',
        error?.message || error,
      );
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

      // Generate signed URLs for stories images
      const storiesWithSignedUrls = await Promise.all(
        storiesResponse.data.map(async (story: any) => {
          const signedImages = await this.getSignedImagesUrls(
            story.images || [],
          );
          return {
            id: story.id,
            title: story.story_name,
            description: story.description,
            images: signedImages,
            image:
              signedImages && signedImages.length > 0 ? signedImages[0] : null,
            created_at: story.created_at,
            updated_at: story.updated_at,
          };
        }),
      );

      return {
        stories: storiesWithSignedUrls,
        total: storiesResponse.total,
      };
    } catch (error: any) {
      this.logger.error('Error fetching stories:', error?.message || error);
      throw new Error('Failed to fetch stories');
    }
  }

  async getStoryById(id: string): Promise<any> {
    try {
      this.logger.log(`Getting story by ID: ${id}`);

      // Get the story by ID
      const story = await this.storiesService.findOne(id);
      this.logger.log(`Found story: ${JSON.stringify(story)}`);

      if (!story) {
        throw new Error('Story not found');
      }

      this.logger.log(
        `Story images before processing: ${JSON.stringify(story.images)}`,
      );
      this.logger.log(`Type of story.images: ${typeof story.images}`);
      this.logger.log(
        `Story.images array check: ${Array.isArray(story.images)}`,
      );

      // Generate signed URLs for story images
      const signedImages = await this.getSignedImagesUrls(story.images || []);
      this.logger.log(
        `Signed images generated: ${JSON.stringify(signedImages)}`,
      );

      return {
        id: story.id,
        title: story.story_name,
        description: story.description,
        fullDescription: story.description, // Use description as fullDescription for now
        content: story.description, // Use description as content for now
        images: signedImages,
        image: signedImages && signedImages.length > 0 ? signedImages[0] : null,
        created_at: story.created_at,
        updated_at: story.updated_at,
      };
    } catch (error: any) {
      this.logger.error('Error fetching story:', error?.message || error);
      this.logger.error('Error stack:', error?.stack);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch story: ${errorMessage}`);
    }
  }

  async getOperationHours() {
    try {
      const operationHoursResponse = await this.operationHoursService.findAll(
        1,
        10,
      );

      // Format operation hours for frontend consumption
      const formattedHours = operationHoursResponse.data.map((hour) => ({
        id: hour.id,
        day: hour.day,
        open_time: hour.open_time,
        close_time: hour.close_time,
        status: hour.status,
        timezone: hour.timezone || 'America/Toronto',
        created_at: hour.created_at,
        updated_at: hour.updated_at,
      }));

      return {
        data: formattedHours,
        total: operationHoursResponse.total,
      };
    } catch (error: any) {
      this.logger.error(
        'Error fetching operation hours:',
        error?.message || error,
      );
      throw new Error('Failed to fetch operation hours');
    }
  }

  async getTodayOperationStatus() {
    try {
      // Use the timezone-aware operation status service
      return await this.operationHoursService.getCurrentOperationStatus();
    } catch (error: any) {
      this.logger.error(
        "Error fetching today's operation status:",
        error?.message || error,
      );
      throw new Error("Failed to fetch today's operation status");
    }
  }
}
