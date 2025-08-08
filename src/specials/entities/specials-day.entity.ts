import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DaysOfWeekEnum } from '../../common/enums';

@Entity('specials_day')
export class SpecialsDay {
  @PrimaryGeneratedColumn('uuid')
  
  id!: string;

  @Column({
    type: 'enum',
    enum: DaysOfWeekEnum,
    unique: true,
    nullable: false,
  })
  
  day_name!: DaysOfWeekEnum;

  @OneToMany('Special', 'specialsDay')
  
  specials!: any[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
