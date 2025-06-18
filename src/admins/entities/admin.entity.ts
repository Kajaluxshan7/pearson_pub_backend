import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdminRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin'
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string; 
  
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  google_id: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ 
    type: 'enum', 
    enum: AdminRole, 
    default: AdminRole.ADMIN 
  })
  role: AdminRole;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}