import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Item } from '../items/entities/item.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    adminId: string,
  ): Promise<Category> {
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      lastEditedByAdminId: adminId,
    });
    return this.categoriesRepository.save(category);
  }

  async getCount(): Promise<{ count: number }> {
    const count = await this.categoriesRepository.count();
    return { count };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: Category[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.lastEditedByAdmin', 'admin');

    if (search) {
      queryBuilder.where(
        'category.name ILIKE :search OR category.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    queryBuilder
      .orderBy('category.created_at', 'DESC')
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

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    adminId: string,
  ): Promise<Category> {
    const category = await this.findOne(id);

    Object.assign(category, updateCategoryDto);
    category.lastEditedByAdminId = adminId;

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if there are items associated with this category
    const itemCount = await this.itemsRepository.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${itemCount} associated item(s). Please remove or reassign the items first.`,
      );
    }

    await this.categoriesRepository.remove(category);
  }
}
