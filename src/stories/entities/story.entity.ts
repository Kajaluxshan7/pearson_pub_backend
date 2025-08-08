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

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  
  id!: string;

  @Column({ nullable: false })
  
  story_name!: string;

  @Column({ type: 'text', nullable: true })
  
  description!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  
  images!: string[];

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'last_edited_by_admin_id' })
  
  lastEditedByAdmin!: Admin;

  @Column({ name: 'last_edited_by_admin_id', type: 'uuid', nullable: true })
  
  lastEditedByAdminId!: string;

  @CreateDateColumn()
  
  created_at!: Date;

  @UpdateDateColumn()
  
  updated_at!: Date;
}
