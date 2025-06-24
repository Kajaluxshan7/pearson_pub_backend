import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubstituteSide } from './entities/substitute-side.entity';
import { CreateSubstituteSideDto } from './dto/create-substitute-side.dto';
import { UpdateSubstituteSideDto } from './dto/update-substitute-side.dto';

@Injectable()
export class SubstituteSidesService {
  constructor(
    @InjectRepository(SubstituteSide)
    private substituteSideRepository: Repository<SubstituteSide>,
  ) {}

  async create(
    createSubstituteSideDto: CreateSubstituteSideDto,
  ): Promise<SubstituteSide> {
    const substituteSide = this.substituteSideRepository.create(
      createSubstituteSideDto,
    );
    return await this.substituteSideRepository.save(substituteSide);
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: SubstituteSide[]; total: number }> {
    const query = this.substituteSideRepository
      .createQueryBuilder('substituteSide')
      .leftJoinAndSelect('substituteSide.lastEditedByAdmin', 'admin');

    if (search) {
      query.where(
        'LOWER(substituteSide.name) LIKE LOWER(:search) OR LOWER(substituteSide.description) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    query.orderBy('substituteSide.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<SubstituteSide> {
    const substituteSide = await this.substituteSideRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!substituteSide) {
      throw new NotFoundException(`SubstituteSide with ID ${id} not found`);
    }

    return substituteSide;
  }

  async update(
    id: string,
    updateSubstituteSideDto: UpdateSubstituteSideDto,
  ): Promise<SubstituteSide> {
    await this.findOne(id); // Check if exists

    await this.substituteSideRepository.update(id, updateSubstituteSideDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const substituteSide = await this.findOne(id);
    await this.substituteSideRepository.remove(substituteSide);
  }
}
