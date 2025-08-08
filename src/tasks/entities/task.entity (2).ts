import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaskPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({
    type: 'enum',
    enum: TaskPriorityEnum,
    default: TaskPriorityEnum.MEDIUM,
  })
  priority: TaskPriorityEnum;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @Column({ type: 'uuid', nullable: true })
  lastEditedByAdminId: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
