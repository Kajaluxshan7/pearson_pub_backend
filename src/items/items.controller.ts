import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';
import { FileUploadService } from '../common/services/file-upload.service';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.itemsService.getCount();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async create(@Body() createItemDto: CreateItemDto, @Request() req) {
    try {
      console.log('🔄 Items Controller - Create request:', {
        createItemDto,
        userId: req.user.id,
      });
      const result = await this.itemsService.create(createItemDto, req.user.id);
      console.log('✅ Items Controller - Create successful');
      return result;
    } catch (error) {
      console.error('❌ Items Controller - Create error:', error);
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('availability') availability?: string,
    @Query('visibility') visibility?: string,
    @Query('is_favourite') is_favourite?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const availabilityBool =
      availability === 'true'
        ? true
        : availability === 'false'
          ? false
          : undefined;
    const visibilityBool =
      visibility === 'true' ? true : visibility === 'false' ? false : undefined;
    const isFavouriteBool =
      is_favourite === 'true'
        ? true
        : is_favourite === 'false'
          ? false
          : undefined;

    return this.itemsService.findAll(
      pageNum,
      limitNum,
      search,
      categoryId,
      availabilityBool,
      visibilityBool,
      isFavouriteBool,
    );
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req,
  ) {
    try {
      console.log('🔄 Items Controller - Update request:', {
        id,
        updateItemDto,
        userId: req.user.id,
      });
      const result = await this.itemsService.update(
        id,
        updateItemDto,
        req.user.id,
      );
      console.log('✅ Items Controller - Update successful');
      return result;
    } catch (error) {
      console.error('❌ Items Controller - Update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  @Post('upload-images')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5)) // Maximum 5 images
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      // Validate maximum number of files
      if (files.length > 5) {
        throw new Error('Maximum 5 images allowed');
      }

      // Validate each file
      for (const file of files) {
        // Check file size (1MB max)
        if (file.size > 1024 * 1024) {
          throw new Error(`File ${file.originalname} exceeds 1MB limit`);
        }

        // Check file type
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(
            `File ${file.originalname} is not a valid image type`,
          );
        }
      }

      const uploadResults = await this.fileUploadService.uploadMultipleFiles(
        files,
        'items',
      );

      // Extract URLs and signed URLs
      const imageUrls = uploadResults.map((result) => result.url);
      const signedUrls = uploadResults.map(
        (result) => result.signedUrl || result.url,
      );

      return {
        imageUrls,
        signedUrls,
        message: `Successfully uploaded ${files.length} image(s)`,
      };
    } catch (error) {
      console.error('❌ Items Controller - Upload error:', error);
      throw error;
    }
  }

  @Post('upload-image')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      // Validate file size (1MB max)
      if (file.size > 1024 * 1024) {
        throw new Error('File size must not exceed 1MB');
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      }

      const uploadResult = await this.fileUploadService.uploadFile(
        file,
        'items',
      );

      return {
        imageUrl: uploadResult.url,
        signedUrl: uploadResult.signedUrl || uploadResult.url,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.error('❌ Items Controller - Upload error:', error);
      throw error;
    }
  }

  @Delete('images/:id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async deleteImage(@Param('id') imageUrl: string) {
    try {
      // Decode the URL parameter
      const decodedUrl = decodeURIComponent(imageUrl);
      await this.fileUploadService.deleteFile(decodedUrl);
      return { success: true };
    } catch (error) {
      console.error('❌ Items Controller - Delete image error:', error);
      throw error;
    }
  }

  @Post('get-signed-urls')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async getSignedUrls(@Body() body: { imageUrls: string[] }) {
    try {
      const signedUrls = await this.fileUploadService.getMultipleSignedUrls(
        body.imageUrls,
      );
      return { signedUrls };
    } catch (error) {
      console.error('❌ Items Controller - Get signed URLs error:', error);
      throw error;
    }
  }
}
