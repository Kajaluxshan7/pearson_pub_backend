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
import { Admin } from '../../admins/entities/admin.entity';

@Entity('specials')
@Check(`
    (special_type = 'daily' AND specials_day_id IS NOT NULL AND seasonal_start_datetime IS NULL AND seasonal_end_datetime IS NULL AND season_name IS NULL) OR
    (special_type = 'seasonal' AND specials_day_id IS NULL AND seasonal_start_datetime IS NOT NULL AND seasonal_end_datetime IS NOT NULL AND season_name IS NOT NULL) OR
    (special_type = 'latenight' AND specials_day_id IS NULL AND seasonal_start_datetime IS NULL AND seasonal_end_datetime IS NULL AND season_name IS NULL)
  `)
export class Special {
  @PrimaryGeneratedColumn('uuid')
  
  id!: string;

  @Column({
    type: 'enum',
    enum: SpecialTypeEnum,
    nullable: false,
  })
  
  special_type!: SpecialTypeEnum;

  @ManyToOne(() => SpecialsDay, { nullable: true })
  @JoinColumn({ name: 'specials_day_id' })
  
  specialsDay!: SpecialsDay;

  @Column({ name: 'specials_day_id', type: 'uuid', nullable: true })
  
  specialsDayId!: string;

  @Column({ type: 'text', nullable: true })
  
  season_name!: string;

  @Column({ type: 'text', nullable: true })
  
  description!: string;

  @Column({ type: 'text', nullable: true })
  
  image_url!: string;

  @Column({ type: 'json', nullable: true })
  
  image_urls!: string[];

  @Column({ type: 'timestamptz', nullable: true })
  
  seasonal_start_datetime!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  
  seasonal_end_datetime!: Date;

  @ManyToOne(() => Admin, { nullable: false })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  
  lastEditedByAdmin!: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: false })
  
  lastEditedByAdminId!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;

  @Column({ type: 'varchar', length: 50, default: 'America/Toronto' })
  
  timezone!: string;
}
