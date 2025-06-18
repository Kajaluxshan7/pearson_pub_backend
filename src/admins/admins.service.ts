import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminRole } from './entities/admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const admin = this.adminsRepository.create(createAdminDto);
    return await this.adminsRepository.save(admin);
  }
  async findAll(): Promise<Admin[]> {
    return await this.adminsRepository.find({
      select: ['id', 'email', 'first_name', 'phone', 'address', 'role', 'is_verified', 'is_active', 'created_at', 'updated_at'],
      where: { is_active: true },
    });
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminsRepository.findOne({ 
      where: { id, is_active: true },
      select: ['id', 'email', 'first_name', 'phone', 'address', 'role', 'is_verified', 'is_active', 'created_at', 'updated_at'],
    });
    
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    await this.adminsRepository.update(id, updateAdminDto);
    return this.findOne(id);
  }
  async remove(id: string): Promise<void> {
    const admin = await this.adminsRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    
    // Prevent deletion of superadmins through this endpoint
    if (admin.role === AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete superadmin through this endpoint');
    }
    
    // Soft delete by deactivating
    admin.is_active = false;
    await this.adminsRepository.save(admin);
  }
}
