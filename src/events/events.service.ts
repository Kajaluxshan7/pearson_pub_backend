import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    adminId: string,
  ): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
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
      queryBuilder.andWhere(
        'event.start_date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    queryBuilder
      .orderBy('event.start_date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    adminId: string,
  ): Promise<Event> {
    const event = await this.findOne(id);

    Object.assign(event, updateEventDto);
    event.lastEditedByAdminId = adminId;

    return this.eventsRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    // Clean up images from S3 before deleting the event
    if (event.images && event.images.length > 0) {
      try {
        console.log(
          `🔄 Cleaning up ${event.images.length} images for event ${id}`,
        );
        await Promise.all(
          event.images.map((imageUrl) =>
            this.fileUploadService.deleteFile(imageUrl),
          ),
        );
        console.log('✅ Images cleaned up successfully');
      } catch (error) {
        console.error('⚠️ Error cleaning up images:', error);
        // Continue with event deletion even if image cleanup fails
      }
    }

    await this.eventsRepository.remove(event);
  }

  async getCount(): Promise<number> {
    return this.eventsRepository.count();
  }
}
