import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationHour, DayOfWeek } from './entities/operation-hour.entity';
import { CreateOperationHourDto } from './dto/create-operation-hour.dto';
import { UpdateOperationHourDto } from './dto/update-operation-hour.dto';
import { TimezoneService } from '../common/services/timezone.service';

@Injectable()
export class OperationHoursService {
  constructor(
    @InjectRepository(OperationHour)
    private operationHoursRepository: Repository<OperationHour>,
    private timezoneService: TimezoneService,
  ) {}

  async create(
    createOperationHourDto: CreateOperationHourDto,
    adminId: string,
  ): Promise<OperationHour> {
    // Convert time from Toronto timezone to UTC for storage
    const convertedOpenTime = this.timezoneService.convertTorontoTimeToUtcTime(
      createOperationHourDto.open_time,
    );
    const convertedCloseTime = this.timezoneService.convertTorontoTimeToUtcTime(
      createOperationHourDto.close_time,
    );

    const operationHour = this.operationHoursRepository.create({
      ...createOperationHourDto,
      open_time: convertedOpenTime,
      close_time: convertedCloseTime,
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

    // Convert UTC times back to Toronto timezone for display
    const convertedData = data.map((hour) => ({
      ...hour,
      open_time: this.timezoneService.convertUtcTimeToTorontoTime(
        hour.open_time,
      ),
      close_time: this.timezoneService.convertUtcTimeToTorontoTime(
        hour.close_time,
      ),
    }));

    // Sort the data manually
    const sortedData = convertedData.sort((a, b) => {
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

    // Convert UTC times back to Toronto timezone for display
    return {
      ...operationHour,
      open_time: this.timezoneService.convertUtcTimeToTorontoTime(
        operationHour.open_time,
      ),
      close_time: this.timezoneService.convertUtcTimeToTorontoTime(
        operationHour.close_time,
      ),
    };
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

    // Convert times from Toronto timezone to UTC for storage
    const updateData = { ...updateOperationHourDto };
    if (updateData.open_time) {
      updateData.open_time = this.timezoneService.convertTorontoTimeToUtcTime(
        updateData.open_time,
      );
    }
    if (updateData.close_time) {
      updateData.close_time = this.timezoneService.convertTorontoTimeToUtcTime(
        updateData.close_time,
      );
    }

    Object.assign(operationHour, updateData);
    operationHour.lastEditedByAdminId = adminId;

    const savedOperationHour =
      await this.operationHoursRepository.save(operationHour);

    // Convert back to Toronto timezone for response
    return {
      ...savedOperationHour,
      open_time: this.timezoneService.convertUtcTimeToTorontoTime(
        savedOperationHour.open_time,
      ),
      close_time: this.timezoneService.convertUtcTimeToTorontoTime(
        savedOperationHour.close_time,
      ),
    };
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

    console.log('🕐 Current day name:', currentDayName);

    // Fetch today's operation hours directly from the database
    const todayHours = await this.operationHoursRepository.findOne({
      where: { day: currentDayName },
    });

    console.log('🕐 Found today hours:', todayHours);

    if (!todayHours) {
      console.log('🕐 No operation hours found for today');
      return {
        isOpen: false,
        todayHours: null,
        status: 'Closed',
        nextChange: null,
      };
    }

    // Use the status column directly from the database
    const isOpen = todayHours.status;
    console.log('🕐 Status from database:', isOpen);

    return {
      isOpen,
      todayHours: {
        ...todayHours,
        open_time: this.timezoneService.convertUtcTimeToTorontoTime(
          todayHours.open_time,
        ),
        close_time: this.timezoneService.convertUtcTimeToTorontoTime(
          todayHours.close_time,
        ),
      },
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
      // Convert UTC times to Toronto timezone for business hours calculations
      const torontoOpenTime = this.timezoneService.convertUtcTimeToTorontoTime(
        hour.open_time,
      );
      const torontoCloseTime = this.timezoneService.convertUtcTimeToTorontoTime(
        hour.close_time,
      );

      return {
        ...hour,
        // Convert times for display first
        open_time: torontoOpenTime,
        close_time: torontoCloseTime,
        isCurrentlyOpen: this.timezoneService.isWithinBusinessHours(
          torontoOpenTime,
          torontoCloseTime,
          hour.day,
        ),
        statusText: this.timezoneService.getOperationStatus(
          torontoOpenTime,
          torontoCloseTime,
          hour.status,
          hour.day,
        ),
        formattedOpenTime:
          this.timezoneService.formatTimeForDisplay(torontoOpenTime),
        formattedCloseTime:
          this.timezoneService.formatTimeForDisplay(torontoCloseTime),
      };
    });
  }
}
