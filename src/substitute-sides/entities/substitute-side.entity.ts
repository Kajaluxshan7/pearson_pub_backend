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

@Entity('substitute_sides')
export class SubstituteSide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  lastEditedByAdmin: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: true })
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
