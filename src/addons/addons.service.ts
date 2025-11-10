import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Addon } from './entities/addon.entity';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Injectable()
export class AddonsService {
  private readonly logger = new Logger(AddonsService.name);

  constructor(
    @InjectRepository(Addon)
    private addonsRepository: Repository<Addon>,
  ) {}

  async create(
    createAddonDto: CreateAddonDto,
    adminId: string,
  ): Promise<Addon> {
    try {
      // Check if addon with same name already exists for this item
      const existingAddon = await this.addonsRepository.findOne({
        where: {
          itemId: createAddonDto.itemId,
          name: createAddonDto.name,
        },
      });

      if (existingAddon) {
        throw new ConflictException(
          `Addon '${createAddonDto.name}' already exists for this item`,
        );
      }

      const addon = this.addonsRepository.create({
        ...createAddonDto,
        lastEditedByAdminId: adminId,
      });
      return this.addonsRepository.save(addon);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        // PostgreSQL unique constraint violation
        throw new ConflictException(
          `Addon '${createAddonDto.name}' already exists for this item`,
        );
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    itemId?: string,
    categoryType?: string,
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

    if (categoryType) {
      queryBuilder.andWhere('addon.category_type = :categoryType', {
        categoryType,
      });
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

  async duplicate(id: string, adminId: string): Promise<Addon> {
    try {
      this.logger.log('Duplicating addon', { id, adminId });

      // Find the original addon
      const originalAddon = await this.findOne(id);
      this.logger.log('Found original addon', { addonId: originalAddon.id });

      // Create a new addon with copied data
      const duplicateData = {
        name: `${originalAddon.name} (Copy)`,
        description: originalAddon.description,
        price: originalAddon.price,
        category_type: originalAddon.category_type,
        itemId: originalAddon.itemId,
      };

      // Check if an addon with this name already exists for this item
      const existingAddon = await this.addonsRepository.findOne({
        where: {
          name: duplicateData.name,
          itemId: originalAddon.itemId,
        },
      });

      if (existingAddon) {
        // If it exists, add a number to make it unique
        let counter = 2;
        let newName = `${originalAddon.name} (Copy ${counter})`;

        while (
          await this.addonsRepository.findOne({
            where: { name: newName, itemId: originalAddon.itemId },
          })
        ) {
          counter++;
          newName = `${originalAddon.name} (Copy ${counter})`;
        }

        duplicateData.name = newName;
      }

      const duplicatedAddon = await this.create(duplicateData, adminId);
      this.logger.log('Addon duplicated successfully', {
        addonId: duplicatedAddon.id,
      });

      return duplicatedAddon;
    } catch (error) {
      this.logger.error(
        'Error duplicating addon',
        error instanceof Error ? error.stack : error,
      );

      // Handle unique constraint violation specifically
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        // PostgreSQL unique violation
        throw new Error('An addon with this name already exists for this item');
      }

      throw error;
    }
  }
}
