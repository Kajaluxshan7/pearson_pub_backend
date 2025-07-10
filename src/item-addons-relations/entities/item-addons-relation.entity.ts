import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Addon } from '../../addons/entities/addon.entity';

@Entity('item_addons_relations')
export class ItemAddonsRelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Item, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'item_id', type: 'uuid', nullable: false })
  itemId: string;

  @ManyToOne(() => Addon, { nullable: false })
  @JoinColumn({ name: 'addon_id' })
  addon: Addon;

  @Column({ name: 'addon_id', type: 'uuid', nullable: false })
  addonId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
