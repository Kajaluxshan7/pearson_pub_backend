import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from '../../admins/entities/admin.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('operation_hours')
export class OperationHour {
  @PrimaryGeneratedColumn('uuid')
  
  id!: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    nullable: false,
  })
  
  day!: DayOfWeek;

  @Column({ type: 'time', nullable: false })
  
  open_time!: string;

  @Column({ type: 'time', nullable: false })
  
  close_time!: string;

  @Column({ default: true })
  
  status!: boolean;

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

  @Column({ type: 'varchar', length: 50, default: 'America/Toronto' })
  
  timezone!: string;
}
