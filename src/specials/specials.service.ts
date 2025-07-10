import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Special } from './entities/special.entity';
import { CreateSpecialDto } from './dto/create-special.dto';
import { UpdateSpecialDto } from './dto/update-special.dto';

@Injectable()
export class SpecialsService {
  constructor(
    @InjectRepository(Special)
    private specialsRepository: Repository<Special>,
  ) {}

  async create(
    createSpecialDto: CreateSpecialDto,
    adminId?: string,
  ): Promise<Special> {
    // Validate business rules
    this.validateSpecialRules(createSpecialDto);

    const special = this.specialsRepository.create({
      ...createSpecialDto,
      lastEditedByAdminId: adminId,
    });
    return await this.specialsRepository.save(special);
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    specialType?: string,
  ): Promise<{ data: Special[]; total: number }> {
    const query = this.specialsRepository
      .createQueryBuilder('special')
      .leftJoinAndSelect('special.specialsDay', 'specialsDay')
      .leftJoinAndSelect('special.menuItem', 'menuItem')
      .leftJoinAndSelect('special.category', 'category')
      .leftJoinAndSelect('special.lastEditedByAdmin', 'admin');

    if (search) {
      query.where(
        'LOWER(special.name) LIKE LOWER(:search) OR LOWER(special.description) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (specialType) {
      query.andWhere('special.special_type = :specialType', { specialType });
    }

    query.orderBy('special.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Special> {
    const special = await this.specialsRepository.findOne({
      where: { id },
      relations: ['specialsDay', 'menuItem', 'category', 'lastEditedByAdmin'],
    });

    if (!special) {
      throw new NotFoundException(`Special with ID ${id} not found`);
    }

    return special;
  }

  async update(
    id: string,
    updateSpecialDto: UpdateSpecialDto,
    adminId?: string,
  ): Promise<Special> {
    await this.findOne(id); // Check if exists

    // Validate business rules
    this.validateSpecialRules(updateSpecialDto);

    // Set admin ID if provided
    const updateData = adminId
      ? { ...updateSpecialDto, lastEditedByAdminId: adminId }
      : updateSpecialDto;

    await this.specialsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const special = await this.findOne(id);
    await this.specialsRepository.remove(special);
  }

  private validateSpecialRules(dto: CreateSpecialDto | UpdateSpecialDto): void {
    // Rule 1: If special_type = 'daily', then specials_day_id is required and seasonal dates should be null
    if (dto.special_type === 'daily') {
      if (!dto.specialsDayId) {
        throw new BadRequestException(
          'specials_day_id is required for daily specials',
        );
      }
      if (dto.seasonal_start_date || dto.seasonal_end_date) {
        throw new BadRequestException(
          'Seasonal dates should not be set for daily specials',
        );
      }
    }

    // Rule 2: If special_type = 'seasonal' or 'latenight', then seasonal_start_date is required and specials_day_id should be null
    if (dto.special_type === 'seasonal' || dto.special_type === 'latenight') {
      if (dto.specialsDayId) {
        throw new BadRequestException(
          'specials_day_id should not be set for seasonal/latenight specials',
        );
      }
      if (!dto.seasonal_start_date) {
        throw new BadRequestException(
          'seasonal_start_date is required for seasonal/latenight specials',
        );
      }
    }

    // Rule 3: Either menu_item_id OR category_id must be set, but not both
    if (dto.menuItemId && dto.categoryId) {
      throw new BadRequestException(
        'Cannot set both menu_item_id and category_id',
      );
    }
    if (!dto.menuItemId && !dto.categoryId) {
      throw new BadRequestException(
        'Either menu_item_id or category_id must be set',
      );
    }
  }
}
