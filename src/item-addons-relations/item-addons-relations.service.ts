import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemAddonsRelation } from './entities/item-addons-relation.entity';
import { CreateItemAddonsRelationDto } from './dto/create-item-addons-relation.dto';
import { UpdateItemAddonsRelationDto } from './dto/update-item-addons-relation.dto';

@Injectable()
export class ItemAddonsRelationsService {
  constructor(
    @InjectRepository(ItemAddonsRelation)
    private itemAddonsRelationRepository: Repository<ItemAddonsRelation>,
  ) {}

  async create(
    createItemAddonsRelationDto: CreateItemAddonsRelationDto,
  ): Promise<ItemAddonsRelation> {
    // Check if relation already exists
    const existingRelation = await this.itemAddonsRelationRepository.findOne({
      where: {
        itemId: createItemAddonsRelationDto.itemId,
        addonId: createItemAddonsRelationDto.addonId,
      },
    });

    if (existingRelation) {
      throw new ConflictException('This item-addon relation already exists');
    }

    const itemAddonsRelation = this.itemAddonsRelationRepository.create(
      createItemAddonsRelationDto,
    );
    return await this.itemAddonsRelationRepository.save(itemAddonsRelation);
  }

  async findAll(
    page = 1,
    limit = 10,
    itemId?: string,
    addonId?: string,
  ): Promise<{ data: ItemAddonsRelation[]; total: number }> {
    const query = this.itemAddonsRelationRepository
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.item', 'item')
      .leftJoinAndSelect('relation.addon', 'addon');

    if (itemId) {
      query.where('relation.itemId = :itemId', { itemId });
    }

    if (addonId) {
      query.andWhere('relation.addonId = :addonId', { addonId });
    }

    query.orderBy('relation.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<ItemAddonsRelation> {
    const itemAddonsRelation = await this.itemAddonsRelationRepository.findOne({
      where: { id },
      relations: ['item', 'addon'],
    });

    if (!itemAddonsRelation) {
      throw new NotFoundException(`ItemAddonsRelation with ID ${id} not found`);
    }

    return itemAddonsRelation;
  }

  async update(
    id: string,
    updateItemAddonsRelationDto: UpdateItemAddonsRelationDto,
  ): Promise<ItemAddonsRelation> {
    await this.findOne(id); // Check if exists

    // Check if new relation would be duplicate
    if (
      updateItemAddonsRelationDto.itemId ||
      updateItemAddonsRelationDto.addonId
    ) {
      const currentRelation = await this.findOne(id);
      const newItemId =
        updateItemAddonsRelationDto.itemId || currentRelation.itemId;
      const newAddonId =
        updateItemAddonsRelationDto.addonId || currentRelation.addonId;

      const existingRelation = await this.itemAddonsRelationRepository.findOne({
        where: {
          itemId: newItemId,
          addonId: newAddonId,
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new ConflictException('This item-addon relation already exists');
      }
    }

    await this.itemAddonsRelationRepository.update(
      id,
      updateItemAddonsRelationDto,
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const itemAddonsRelation = await this.findOne(id);
    await this.itemAddonsRelationRepository.remove(itemAddonsRelation);
  }

  async findByItemId(itemId: string): Promise<ItemAddonsRelation[]> {
    return await this.itemAddonsRelationRepository.find({
      where: { itemId },
      relations: ['addon'],
    });
  }

  async findByAddonId(addonId: string): Promise<ItemAddonsRelation[]> {
    return await this.itemAddonsRelationRepository.find({
      where: { addonId },
      relations: ['item'],
    });
  }
}
