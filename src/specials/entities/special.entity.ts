import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { SpecialTypeEnum } from '../../common/enums';
import { SpecialsDay } from './specials-day.entity';
import { Item } from '../../items/entities/item.entity';
import { Category } from '../../categories/entities/category.entity';
import { Admin } from '../../admins/entities/admin.entity';

@Entity('specials')
@Check(`
    (special_type = 'daily' AND specials_day_id IS NOT NULL AND seasonal_start_date IS NULL AND seasonal_end_date IS NULL) OR
    (special_type IN ('seasonal', 'latenight') AND specials_day_id IS NULL AND seasonal_start_date IS NOT NULL) OR
    (menu_item_id IS NOT NULL AND category_id IS NULL) OR
    (menu_item_id IS NULL AND category_id IS NOT NULL)
  `)
export class Special {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SpecialTypeEnum,
    nullable: false,
  })
  special_type: SpecialTypeEnum;

  @ManyToOne(() => SpecialsDay, (specialsDay) => specialsDay.specials, {
    nullable: true,
  })
  @JoinColumn({ name: 'specials_day_id' })
  specialsDay: SpecialsDay;

  @Column({ name: 'specials_day_id', type: 'uuid', nullable: true })
  specialsDayId: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'boolean', default: false })
  from_menu: boolean;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: Item;

  @Column({ name: 'menu_item_id', type: 'uuid', nullable: true })
  menuItemId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ type: 'date', nullable: true })
  seasonal_start_date: Date;

  @Column({ type: 'date', nullable: true })
  seasonal_end_date: Date;

  @ManyToOne(() => Admin, { nullable: false })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  lastEditedByAdmin: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: false })
  lastEditedByAdminId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
