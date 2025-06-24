import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialsDay } from './entities/specials-day.entity';
import { CreateSpecialsDayDto } from './dto/create-specials-day.dto';
import { UpdateSpecialsDayDto } from './dto/update-specials-day.dto';

@Injectable()
export class SpecialsDayService {
  constructor(
    @InjectRepository(SpecialsDay)
    private specialsDayRepository: Repository<SpecialsDay>,
  ) {}

  async create(
    createSpecialsDayDto: CreateSpecialsDayDto,
  ): Promise<SpecialsDay> {
    try {
      const specialsDay =
        this.specialsDayRepository.create(createSpecialsDayDto);
      return await this.specialsDayRepository.save(specialsDay);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('A day with this name already exists');
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: SpecialsDay[]; total: number }> {
    const query = this.specialsDayRepository.createQueryBuilder('specialsDay');

    if (search) {
      query.where('LOWER(specialsDay.day_name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    query.orderBy('specialsDay.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<SpecialsDay> {
    const specialsDay = await this.specialsDayRepository.findOne({
      where: { id },
      relations: ['specials'],
    });

    if (!specialsDay) {
      throw new NotFoundException(`SpecialsDay with ID ${id} not found`);
    }

    return specialsDay;
  }

  async update(
    id: string,
    updateSpecialsDayDto: UpdateSpecialsDayDto,
  ): Promise<SpecialsDay> {
    await this.findOne(id); // Check if exists

    try {
      await this.specialsDayRepository.update(id, updateSpecialsDayDto);
      return this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('A day with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const specialsDay = await this.findOne(id);
    await this.specialsDayRepository.remove(specialsDay);
  }
}
