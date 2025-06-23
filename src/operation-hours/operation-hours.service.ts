import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationHour, DayOfWeek } from './entities/operation-hour.entity';
import { CreateOperationHourDto } from './dto/create-operation-hour.dto';
import { UpdateOperationHourDto } from './dto/update-operation-hour.dto';

@Injectable()
export class OperationHoursService {
  constructor(
    @InjectRepository(OperationHour)
    private operationHoursRepository: Repository<OperationHour>,
  ) {}

  async create(
    createOperationHourDto: CreateOperationHourDto,
    adminId: string,
  ): Promise<OperationHour> {
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

    queryBuilder
      .orderBy('operationHour.day', 'ASC')
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

  async findOne(id: string): Promise<OperationHour> {
    const operationHour = await this.operationHoursRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!operationHour) {
      throw new NotFoundException(`Operation hour with ID ${id} not found`);
    }

    return operationHour;
  }

  async update(
    id: string,
    updateOperationHourDto: UpdateOperationHourDto,
    adminId: string,
  ): Promise<OperationHour> {
    const operationHour = await this.findOne(id);

    Object.assign(operationHour, updateOperationHourDto);
    operationHour.lastEditedByAdminId = adminId;

    return this.operationHoursRepository.save(operationHour);
  }

  async remove(id: string): Promise<void> {
    const operationHour = await this.findOne(id);
    await this.operationHoursRepository.remove(operationHour);
  }

  async getCount(): Promise<number> {
    return this.operationHoursRepository.count();
  }
}
