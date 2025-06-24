import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WingSauce } from './entities/wing-sauce.entity';
import { CreateWingSauceDto } from './dto/create-wing-sauce.dto';
import { UpdateWingSauceDto } from './dto/update-wing-sauce.dto';

@Injectable()
export class WingSaucesService {
  constructor(
    @InjectRepository(WingSauce)
    private wingSauceRepository: Repository<WingSauce>,
  ) {}

  async create(createWingSauceDto: CreateWingSauceDto): Promise<WingSauce> {
    try {
      const wingSauce = this.wingSauceRepository.create(createWingSauceDto);
      return await this.wingSauceRepository.save(wingSauce);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException(
          'A wing sauce with this name already exists',
        );
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: WingSauce[]; total: number }> {
    const query = this.wingSauceRepository
      .createQueryBuilder('wingSauce')
      .leftJoinAndSelect('wingSauce.lastEditedByAdmin', 'admin');

    if (search) {
      query.where(
        'LOWER(wingSauce.name) LIKE LOWER(:search) OR LOWER(wingSauce.description) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    query.orderBy('wingSauce.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<WingSauce> {
    const wingSauce = await this.wingSauceRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!wingSauce) {
      throw new NotFoundException(`WingSauce with ID ${id} not found`);
    }

    return wingSauce;
  }

  async update(
    id: string,
    updateWingSauceDto: UpdateWingSauceDto,
  ): Promise<WingSauce> {
    await this.findOne(id); // Check if exists

    try {
      await this.wingSauceRepository.update(id, updateWingSauceDto);
      return this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException(
          'A wing sauce with this name already exists',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const wingSauce = await this.findOne(id);
    await this.wingSauceRepository.remove(wingSauce);
  }
}
