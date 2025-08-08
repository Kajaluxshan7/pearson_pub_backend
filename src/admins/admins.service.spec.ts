import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminsService } from './admins.service';
import { Admin } from './entities/admin.entity';
import { FileUploadService } from '../common/services/file-upload.service';

describe('AdminsService', () => {
  let service: AdminsService;
  let mockRepository: Partial<Repository<Admin>>;
  let mockFileUploadService: Partial<FileUploadService>;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    // Create mock file upload service
    mockFileUploadService = {
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        {
          provide: getRepositoryToken(Admin),
          useValue: mockRepository,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
