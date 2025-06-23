import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Addon } from './entities/addon.entity';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Injectable()
export class AddonsService {
  constructor(
    @InjectRepository(Addon)
    private addonsRepository: Repository<Addon>,
  ) {}

  async create(
    createAddonDto: CreateAddonDto,
    adminId: string,
  ): Promise<Addon> {
    const addon = this.addonsRepository.create({
      ...createAddonDto,
      lastEditedByAdminId: adminId,
    });
    return this.addonsRepository.save(addon);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    itemId?: string,
  ): Promise<{
    data: Addon[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.addonsRepository
      .createQueryBuilder('addon')
      .leftJoinAndSelect('addon.item', 'item')
      .leftJoinAndSelect('addon.lastEditedByAdmin', 'admin');

    if (search) {
      queryBuilder.where(
        'addon.name ILIKE :search OR addon.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    if (itemId) {
      queryBuilder.andWhere('addon.itemId = :itemId', { itemId });
    }

    queryBuilder
      .orderBy('addon.created_at', 'DESC')
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

  async findOne(id: string): Promise<Addon> {
    const addon = await this.addonsRepository.findOne({
      where: { id },
      relations: ['item', 'lastEditedByAdmin'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    return addon;
  }

  async update(
    id: string,
    updateAddonDto: UpdateAddonDto,
    adminId: string,
  ): Promise<Addon> {
    const addon = await this.findOne(id);

    Object.assign(addon, updateAddonDto);
    addon.lastEditedByAdminId = adminId;

    return this.addonsRepository.save(addon);
  }

  async remove(id: string): Promise<void> {
    const addon = await this.findOne(id);
    await this.addonsRepository.remove(addon);
  }

  async getCount(): Promise<number> {
    return this.addonsRepository.count();
  }
}
