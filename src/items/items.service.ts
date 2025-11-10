import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { Addon } from '../addons/entities/addon.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ItemsService {
  private readonly logger = new LoggerService(ItemsService.name);

  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Addon)
    private addonsRepository: Repository<Addon>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createItemDto: CreateItemDto, adminId: string): Promise<Item> {
    // Calculate final price based on original_price and discount
    let finalPrice: number | null = null;

    if (
      createItemDto.original_price !== undefined &&
      createItemDto.original_price !== null
    ) {
      finalPrice = createItemDto.original_price;
      if (createItemDto.discount && createItemDto.discount > 0) {
        finalPrice =
          createItemDto.original_price * (1 - createItemDto.discount / 100);
      }
    }

    const item = this.itemsRepository.create({
      ...createItemDto,
      price: finalPrice,
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
      .orderBy('item.display_order', 'ASC')
      .addOrderBy('item.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    // Generate signed URLs for images
    const dataWithSignedUrls = await Promise.all(
      data.map(async (item) => {
        if (item.images && item.images.length > 0) {
          try {
            const signedUrls =
              await this.fileUploadService.getMultipleSignedUrls(item.images);
            return { ...item, images: signedUrls };
          } catch (error: any) {
            this.logger.log(
              `Failed to generate signed URLs for item ${item.id}: ${error?.message || error}`,
            );
            return item;
          }
        }
        return item;
      }),
    );

    return {
      data: dataWithSignedUrls,
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

    // Generate signed URLs for images
    if (item.images && item.images.length > 0) {
      try {
        const signedUrls = await this.fileUploadService.getMultipleSignedUrls(
          item.images,
        );
        item.images = signedUrls;
      } catch (error: any) {
        this.logger.log(
          `Failed to generate signed URLs for item ${item.id}: ${error?.message || error}`,
        );
      }
    }

    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    adminId: string,
  ): Promise<Item> {
    try {
      this.logger.log(
        `🔄 Updating item: ${JSON.stringify({ id, updateItemDto, adminId })}`,
      );
      const item = await this.findOne(id);
      this.logger.log(`📄 Found item: ${JSON.stringify(item)}`);

      Object.assign(item, updateItemDto);

      // Recalculate price if original_price or discount changed
      if (
        updateItemDto.original_price !== undefined ||
        updateItemDto.discount !== undefined
      ) {
        const originalPrice =
          updateItemDto.original_price !== undefined
            ? updateItemDto.original_price
            : item.original_price;
        const discount =
          updateItemDto.discount !== undefined
            ? updateItemDto.discount
            : (item.discount ?? 0);

        if (originalPrice !== null && originalPrice !== undefined) {
          item.price =
            discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
        } else {
          item.price = null;
        }
      }

      item.lastEditedByAdminId = adminId;

      const savedItem = await this.itemsRepository.save(item);
      this.logger.log(
        `✅ Item updated successfully: ${JSON.stringify(savedItem)}`,
      );
      return savedItem;
    } catch (error: any) {
      this.logger.error('❌ Error updating item:', error?.message || error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);

    // Check if there are addons associated with this item
    const addonCount = await this.addonsRepository.count({
      where: { itemId: id },
    });

    if (addonCount > 0) {
      throw new BadRequestException(
        `Cannot delete item "${item.name}" because it has ${addonCount} associated addon(s). Please remove the addons first.`,
      );
    }

    // Clean up images from S3 before deleting the item
    if (item.images && item.images.length > 0) {
      try {
        this.logger.log(
          `🔄 Cleaning up ${item.images.length} images for item ${id}`,
        );
        await Promise.all(
          item.images.map((imageUrl) =>
            this.fileUploadService.deleteFile(imageUrl),
          ),
        );
        this.logger.log('✅ Images cleaned up successfully');
      } catch (error: any) {
        this.logger.error(
          '⚠️ Error cleaning up images:',
          error?.message || error,
        );
        // Continue with item deletion even if image cleanup fails
      }
    }

    await this.itemsRepository.remove(item);
  }

  async getCount(): Promise<number> {
    return this.itemsRepository.count();
  }

  async reorderItems(itemIds: string[]): Promise<void> {
    // Update display_order for each item based on their position in the array
    const updatePromises = itemIds.map((id, index) => {
      return this.itemsRepository.update(id, { display_order: index + 1 });
    });

    await Promise.all(updatePromises);
  }
}
