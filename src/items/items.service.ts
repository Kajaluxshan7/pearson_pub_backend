import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto, adminId: string): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      lastEditedByAdminId: adminId,
    });
    return this.itemsRepository.save(item);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: string,
    availability?: boolean,
    visibility?: boolean,
    is_favourite?: boolean,
  ): Promise<{
    data: Item[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.lastEditedByAdmin', 'admin');

    if (search) {
      queryBuilder.where(
        'item.name ILIKE :search OR item.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (availability !== undefined) {
      queryBuilder.andWhere('item.availability = :availability', {
        availability,
      });
    }

    if (visibility !== undefined) {
      queryBuilder.andWhere('item.visibility = :visibility', { visibility });
    }

    if (is_favourite !== undefined) {
      queryBuilder.andWhere('item.is_favourite = :is_favourite', {
        is_favourite,
      });
    }

    queryBuilder
      .orderBy('item.created_at', 'DESC')
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

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['category', 'lastEditedByAdmin'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    adminId: string,
  ): Promise<Item> {
    const item = await this.findOne(id);

    Object.assign(item, updateItemDto);
    item.lastEditedByAdminId = adminId;

    return this.itemsRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.itemsRepository.remove(item);
  }

  async getCount(): Promise<number> {
    return this.itemsRepository.count();
  }
}
