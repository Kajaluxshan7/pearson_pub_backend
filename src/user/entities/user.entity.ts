import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // <--- Changed to 'uuid' strategy
  id: string; // <--- Changed type to string
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true }) // Made nullable for Google OAuth users
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

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}