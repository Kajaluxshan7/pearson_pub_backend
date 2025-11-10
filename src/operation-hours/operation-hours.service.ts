import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationHour, DayOfWeek } from './entities/operation-hour.entity';
import { CreateOperationHourDto } from './dto/create-operation-hour.dto';
import { UpdateOperationHourDto } from './dto/update-operation-hour.dto';
import { TimezoneService } from '../common/services/timezone.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class OperationHoursService {
  private readonly logger = new LoggerService(OperationHoursService.name);

  constructor(
    @InjectRepository(OperationHour)
    private operationHoursRepository: Repository<OperationHour>,
    private timezoneService: TimezoneService,
  ) {}

  async create(
    createOperationHourDto: CreateOperationHourDto,
    adminId: string,
  ): Promise<OperationHour> {
    // TIME columns store local Toronto time directly - no conversion needed
    const operationHour = this.operationHoursRepository.create({
      ...createOperationHourDto,
      lastEditedByAdminId: adminId,
    });
    return this.operationHoursRepository.save(operationHour);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    day?: DayOfWeek,
  ): Promise<{
    data: OperationHour[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.operationHoursRepository
      .createQueryBuilder('operationHour')
      .leftJoinAndSelect('operationHour.lastEditedByAdmin', 'admin');

    if (day) {
      queryBuilder.where('operationHour.day = :day', { day });
    }

    // Custom ordering for days of the week
    const orderMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    const [data, total] = await queryBuilder.getManyAndCount();

    // TIME columns return local Toronto time directly - no conversion needed
    // Sort the data manually
    const sortedData = data.sort((a, b) => {
      const orderA = orderMap[a.day] || 8;
      const orderB = orderMap[b.day] || 8;
      return orderA - orderB;
    });

    // Apply pagination manually
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<OperationHour> {
    const operationHour = await this.operationHoursRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!operationHour) {
      throw new NotFoundException(`Operation hour with ID ${id} not found`);
    }

    // TIME columns return local Toronto time directly - no conversion needed
    return operationHour;
  }

  async update(
    id: string,
    updateOperationHourDto: UpdateOperationHourDto,
    adminId: string,
  ): Promise<OperationHour> {
    const operationHour = await this.operationHoursRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!operationHour) {
      throw new NotFoundException(`Operation hour with ID ${id} not found`);
    }

    // TIME columns store local Toronto time directly - no conversion needed
    Object.assign(operationHour, updateOperationHourDto);
    operationHour.lastEditedByAdminId = adminId;

    return await this.operationHoursRepository.save(operationHour);
  }

  async remove(id: string): Promise<void> {
    const operationHour = await this.findOne(id);
    await this.operationHoursRepository.remove(operationHour);
  }

  async getCount(): Promise<number> {
    return this.operationHoursRepository.count();
  }

  /**
   * Get current operation status for today
   * @returns Operation status including if open and today's hours
   */
  async getCurrentOperationStatus(): Promise<{
    isOpen: boolean;
    todayHours: OperationHour | null;
    status: string;
    nextChange: string | null;
  }> {
    const now = this.timezoneService.getCurrentEasternTime();
    const currentDayName = now
      .toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'America/Toronto',
      })
      .toLowerCase() as DayOfWeek;

    this.logger.log(`🕐 Current day name: ${currentDayName}`);

    // Fetch today's operation hours directly from the database
    const todayHours = await this.operationHoursRepository.findOne({
      where: { day: currentDayName },
    });

    this.logger.log(`🕐 Found today hours: ${JSON.stringify(todayHours)}`);

    if (!todayHours) {
      this.logger.log('🕐 No operation hours found for today');
      return {
        isOpen: false,
        todayHours: null,
        status: 'Closed',
        nextChange: null,
      };
    }

    // Use the status column directly from the database
    const isOpen = todayHours.status;
    this.logger.log(`🕐 Status from database: ${isOpen}`);

    return {
      isOpen,
      todayHours, // TIME columns return local Toronto time directly
      status: isOpen ? 'Open' : 'Closed',
      nextChange: null, // Could be enhanced to show next opening/closing time
    };
  }

  /**
   * Convert time string to minutes for comparison
   * @param timeString - Time in HH:MM format
   * @returns minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get all operation hours with current status information
   */
  async getAllWithStatus(): Promise<
    (OperationHour & {
      isCurrentlyOpen: boolean;
      statusText: string;
      formattedOpenTime: string;
      formattedCloseTime: string;
    })[]
  > {
    const allHours = await this.operationHoursRepository.find({
      relations: ['lastEditedByAdmin'],
    });

    return allHours.map((hour) => {
      // TIME columns return local Toronto time directly - no conversion needed
      return {
        ...hour,
        isCurrentlyOpen: this.timezoneService.isWithinBusinessHours(
          hour.open_time,
          hour.close_time,
          hour.day,
        ),
        statusText: this.timezoneService.getOperationStatus(
          hour.open_time,
          hour.close_time,
          hour.status,
          hour.day,
        ),
        formattedOpenTime: this.timezoneService.formatTimeForDisplay(
          hour.open_time,
        ),
        formattedCloseTime: this.timezoneService.formatTimeForDisplay(
          hour.close_time,
        ),
      };
    });
  }
}
