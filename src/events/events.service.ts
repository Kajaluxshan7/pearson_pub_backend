import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { TimezoneService } from '../common/services/timezone.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class EventsService {
  private readonly logger = new LoggerService(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private fileUploadService: FileUploadService,
    private timezoneService: TimezoneService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    adminId: string,
  ): Promise<Event> {
    // Handle datetime strings that may already be in UTC format
    const startDateUtc = this.timezoneService.parseEventDateTime(
      createEventDto.start_date,
    );
    const endDateUtc = this.timezoneService.parseEventDateTime(
      createEventDto.end_date,
    );

    const event = this.eventsRepository.create({
      ...createEventDto,
      start_date: startDateUtc,
      end_date: endDateUtc,
      lastEditedByAdminId: adminId,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    data: Event[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.lastEditedByAdmin', 'admin');

    if (search) {
      queryBuilder.where(
        'event.name ILIKE :search OR event.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    if (startDate && endDate) {
      // Convert Eastern Time dates to UTC for database queries
      const startDateUtc = this.timezoneService.convertEasternToUtc(startDate);
      const endDateUtc = this.timezoneService.convertEasternToUtc(endDate);

      queryBuilder.andWhere(
        'event.start_date BETWEEN :startDate AND :endDate',
        {
          startDate: startDateUtc,
          endDate: endDateUtc,
        },
      );
    }

    queryBuilder
      .orderBy('event.start_date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Add timezone-aware computed properties to each event
    const eventsWithTimezone = data.map((event) => ({
      ...event,
      status: this.timezoneService.calculateEventStatus(
        event.start_date,
        event.end_date,
      ),
      dateRange: this.timezoneService.formatEventDateRange(
        event.start_date,
        event.end_date,
      ),
      startDateEastern: this.timezoneService.convertUtcToEastern(
        event.start_date,
      ),
      endDateEastern: this.timezoneService.convertUtcToEastern(event.end_date),
    }));
    const totalPages = Math.ceil(total / limit);

    // Generate signed URLs for images
    const dataWithSignedUrls = await Promise.all(
      eventsWithTimezone.map(async (event) => {
        if (event.images && event.images.length > 0) {
          try {
            const signedUrls =
              await this.fileUploadService.getMultipleSignedUrls(event.images);
            return { ...event, images: signedUrls };
          } catch (error: any) {
            this.logger.log(
              `Failed to generate signed URLs for event ${event.id}: ${error?.message || error}`,
            );
            return event;
          }
        }
        return event;
      }),
    );

    return {
      data: dataWithSignedUrls,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Generate signed URLs for images
    if (event.images && event.images.length > 0) {
      try {
        const signedUrls = await this.fileUploadService.getMultipleSignedUrls(
          event.images,
        );
        event.images = signedUrls;
      } catch (error: any) {
        this.logger.log(
          `Failed to generate signed URLs for event ${event.id}: ${error?.message || error}`,
        );
      }
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    adminId: string,
  ): Promise<Event> {
    const event = await this.findOne(id);

    // Handle datetime strings that may already be in UTC format if provided
    const updateData: Partial<Event> = {
      name: updateEventDto.name,
      description: updateEventDto.description,
      images: updateEventDto.images,
    };

    // Handle date fields with proper timezone conversion
    if (updateEventDto.start_date) {
      updateData.start_date = this.timezoneService.parseEventDateTime(
        updateEventDto.start_date,
      );
    }
    if (updateEventDto.end_date) {
      updateData.end_date = this.timezoneService.parseEventDateTime(
        updateEventDto.end_date,
      );
    }

    Object.assign(event, updateData);
    event.lastEditedByAdminId = adminId;

    return this.eventsRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    // Clean up images from S3 before deleting the event
    if (event.images && event.images.length > 0) {
      try {
        this.logger.log(
          `🔄 Cleaning up ${event.images.length} images for event ${id}`,
        );
        await Promise.all(
          event.images.map((imageUrl) =>
            this.fileUploadService.deleteFile(imageUrl),
          ),
        );
        this.logger.log('✅ Images cleaned up successfully');
      } catch (error: any) {
        this.logger.error(
          '⚠️ Error cleaning up images:',
          error?.message || error,
        );
        // Continue with event deletion even if image cleanup fails
      }
    }

    await this.eventsRepository.remove(event);
  }

  async getCount(): Promise<number> {
    return this.eventsRepository.count();
  }
}
