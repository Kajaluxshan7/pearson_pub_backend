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
      ])
      .where('admin.is_active = :isActive', { isActive: true });

    // Normal admins can only see other normal admins
    if (currentAdminRole === AdminRole.ADMIN) {
      queryBuilder.andWhere('admin.role = :role', { role: AdminRole.ADMIN });
    }
    // Superadmins can see both normal admins and superadmins

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
    return this.findOne(id);
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

    // Soft delete by deactivating
    admin.is_active = false;
    await this.adminsRepository.save(admin);
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

    // Only show active admins by default, unless specifically requesting inactive ones
    if (!filters.includeInactive) {
      queryBuilder.where('admin.is_active = :isActive', { isActive: true });
    }

    // Role-based filtering - normal admins can only see other normal admins
    if (currentAdminRole === AdminRole.ADMIN) {
      queryBuilder.andWhere('admin.role = :role', { role: AdminRole.ADMIN });
    }
    // Superadmins can see both normal admins and superadmins

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(admin.email ILIKE :search OR admin.first_name ILIKE :search OR admin.phone ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.role) {
      queryBuilder.andWhere('admin.role = :filterRole', { filterRole: filters.role });
    }

    if (filters.status !== undefined) {
      queryBuilder.andWhere('admin.is_verified = :status', { status: filters.status });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by created_at desc
    queryBuilder.orderBy('admin.created_at', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

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
    
    return this.findOne(id);
  }
}
