import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { AdminRole } from '../../admins/entities/admin.entity';

@Entity('admin_invitations')
export class AdminInvitation {
  @PrimaryGeneratedColumn('uuid')
  
  id!: string;

  @Column({ unique: true, nullable: false })
  
  email!: string;

  @Column({ nullable: false })
  
  token_hash!: string;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  
  role!: AdminRole;

  @Column({ nullable: false })
  
  expires_at!: Date;

  @Column({ default: false })
  
  is_used!: boolean;

  @Column({ nullable: false })
  
  invited_by!: string; // Admin ID who sent the invitation

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
