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

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ type: 'timestamptz', nullable: false })
  start_date!: Date;

  @Column({ type: 'timestamptz', nullable: false })
  end_date!: Date;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  lastEditedByAdmin!: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: true })
  lastEditedByAdminId!: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'",
    onUpdate: "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'",
  })
  updated_at!: Date;

  @Column({ type: 'varchar', length: 50, default: 'America/Toronto' })
  timezone!: string;
}
