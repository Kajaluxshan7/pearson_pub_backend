import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
  async findAll(currentAdminRole: AdminRole): Promise<Admin[]> {
    const queryBuilder = this.adminsRepository
      .createQueryBuilder('admin')
      .select([
        'admin.id',
        'admin.email',
        'admin.first_name',
        'admin.phone',
        'admin.address',
        'admin.role',
        'admin.is_verified',
        'admin.is_active',
        'admin.created_at',
        'admin.updated_at',
      ]);

    // Normal admins can only see verified and active normal admins
    if (currentAdminRole === AdminRole.ADMIN) {
      queryBuilder
        .where('admin.role = :role', { role: AdminRole.ADMIN })
        .andWhere('admin.is_verified = :isVerified', { isVerified: true })
        .andWhere('admin.is_active = :isActive', { isActive: true });
    }
    // Superadmins can see all admins regardless of status

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminsRepository.findOne({
      where: { id, is_active: true },
      select: [
        'id',
        'email',
        'first_name',
        'phone',
        'address',
        'role',
        'is_verified',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }
  async update(
    id: string,
    updateAdminDto: UpdateAdminDto,
    currentAdminId: string,
    currentAdminRole: AdminRole,
  ): Promise<Admin> {
    const targetAdmin = await this.adminsRepository.findOne({ where: { id } });

    if (!targetAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Only superadmins can manage other admins
    if (currentAdminRole !== AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can manage other admins');
    }

    // Superadmins cannot be managed by anyone (including other superadmins)
    if (targetAdmin.role === AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmins cannot be managed');
    }

    await this.adminsRepository.update(id, updateAdminDto);

    // Return the updated admin with selected fields
    const updatedAdmin = await this.adminsRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'first_name',
        'phone',
        'address',
        'role',
        'is_verified',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!updatedAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found after update`);
    }

    return updatedAdmin;
  }
  async remove(id: string, currentAdminRole: AdminRole): Promise<void> {
    const admin = await this.adminsRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Only superadmins can delete other admins
    if (currentAdminRole !== AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can delete other admins');
    }

    // Prevent deletion of superadmins
    if (admin.role === AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmins cannot be deleted');
    }

    // Hard delete from database
    await this.adminsRepository.remove(admin);
  }

  async getCount(): Promise<number> {
    return this.adminsRepository.count({ where: { is_active: true } });
  }
  async getAllWithFilters(
    page: number = 1,
    limit: number = 10,
    currentAdminRole: AdminRole,
    filters: {
      search?: string;
      role?: AdminRole;
      status?: boolean;
      includeInactive?: boolean;
    } = {},
  ): Promise<{ data: Admin[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.adminsRepository
      .createQueryBuilder('admin')
      .select([
        'admin.id',
        'admin.email',
        'admin.first_name',
        'admin.phone',
        'admin.address',
        'admin.role',
        'admin.is_verified',
        'admin.is_active',
        'admin.created_at',
        'admin.updated_at',
      ]);

    console.log('🔍 Admin search filters:', { filters, currentAdminRole });

    // Role-based visibility rules
    if (currentAdminRole === AdminRole.ADMIN) {
      // Normal admins can only see verified and active normal admins
      queryBuilder
        .where('admin.role = :role', { role: AdminRole.ADMIN })
        .andWhere('admin.is_verified = :isVerified', { isVerified: true })
        .andWhere('admin.is_active = :isActive', { isActive: true });
    } else {
      // Superadmins can see all admins (active and inactive)
      // No initial filter - superadmins see everything
    }

    // Apply search filter - more comprehensive search
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
      console.log('🔍 Searching with term:', searchTerm);
      queryBuilder.andWhere(
        '(LOWER(admin.email) LIKE :search OR LOWER(admin.first_name) LIKE :search OR admin.phone LIKE :search OR LOWER(admin.address) LIKE :search)',
        { search: searchTerm },
      );
    }

    // Apply role filter (only for superadmins)
    if (filters.role && currentAdminRole === AdminRole.SUPERADMIN) {
      queryBuilder.andWhere('admin.role = :filterRole', {
        filterRole: filters.role,
      });
    }

    // Apply status filter (only for superadmins)
    if (
      filters.status !== undefined &&
      currentAdminRole === AdminRole.SUPERADMIN
    ) {
      queryBuilder.andWhere('admin.is_active = :status', {
        status: filters.status,
      });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('admin.created_at', 'DESC');

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async toggleStatus(
    id: string,
    currentAdminId: string,
    currentAdminRole: AdminRole,
  ): Promise<Admin> {
    const targetAdmin = await this.adminsRepository.findOne({ where: { id } });

    if (!targetAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Only superadmins can manage other admins status
    if (currentAdminRole !== AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can manage admin status');
    }

    // Superadmins cannot change their own status or other superadmins status
    if (targetAdmin.role === AdminRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmin status cannot be changed');
    }

    // Cannot deactivate self
    if (targetAdmin.id === currentAdminId) {
      throw new ForbiddenException('Cannot change your own status');
    }

    // Toggle the is_active status
    targetAdmin.is_active = !targetAdmin.is_active;
    await this.adminsRepository.save(targetAdmin);

    // Return the admin with selected fields (similar to findOne)
    const updatedAdmin = await this.adminsRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'first_name',
        'phone',
        'address',
        'role',
        'is_verified',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!updatedAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found after update`);
    }

    return updatedAdmin;
  }
}
