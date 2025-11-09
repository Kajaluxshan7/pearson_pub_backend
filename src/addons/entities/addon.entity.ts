import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Admin } from '../../admins/entities/admin.entity';

@Entity('addons')
@Unique(['itemId', 'name']) // Prevent duplicate addon names for the same item
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Item, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'item_id', type: 'uuid', nullable: false })
  itemId!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  category_type!: string;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  lastEditedByAdmin!: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: true })
  lastEditedByAdminId!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
