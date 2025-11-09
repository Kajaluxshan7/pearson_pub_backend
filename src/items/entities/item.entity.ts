import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';
import { Admin } from '../../admins/entities/admin.entity';
import { ItemsSizeEnum } from '../../common/enums';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'category_id', type: 'uuid', nullable: false })
  categoryId!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: null,
  })
  discount!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  price!: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  ingredients!: string[];
  @Column({
    type: 'enum',
    enum: ItemsSizeEnum,
    array: true,
    default: '{}',
  })
  sizes!: ItemsSizeEnum[];

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ default: true })
  availability!: boolean;

  @Column({ default: true })
  visibility!: boolean;

  @Column({ default: false })
  is_favourite!: boolean;

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
