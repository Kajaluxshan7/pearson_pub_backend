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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';
import { FileUploadService } from '../common/services/file-upload.service';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.eventsService.getCount();
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async create(@Body() createEventDto: CreateEventDto, @Request() req) {
    try {
      console.log('🔄 Events Controller - Create request:', createEventDto);
      const result = await this.eventsService.create(
        createEventDto,
        req.user.id,
      );
      console.log('✅ Events Controller - Create successful');
      return result;
    } catch (error: any) {
      console.error('❌ Events Controller - Create error:', error);
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.eventsService.findAll(
      pageNum,
      limitNum,
      search,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
    try {
      console.log('🔄 Events Controller - Update request:', {
        id,
        updateEventDto,
      });
      const result = await this.eventsService.update(
        id,
        updateEventDto,
        req.user.id,
      );
      console.log('✅ Events Controller - Update successful');
      return result;
    } catch (error: any) {
      console.error('❌ Events Controller - Update error:', error);
      throw error;
    }
  }
  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    try {
      console.log('🔄 Events Controller - Delete request for ID:', id);
      await this.eventsService.remove(id);
      console.log('✅ Events Controller - Delete successful');
      return { message: 'Event deleted successfully' };
    } catch (error: any) {
      console.error('❌ Events Controller - Delete error:', error);
      throw error;
    }
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
        'events',
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
    } catch (error: any) {
      console.error('❌ Events Controller - Upload error:', error);
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
        'events',
      );

      return {
        imageUrl: uploadResult.url,
        signedUrl: uploadResult.signedUrl || uploadResult.url,
        message: 'Image uploaded successfully',
      };
    } catch (error: any) {
      console.error('❌ Events Controller - Upload error:', error);
      throw error;
    }
  }

  @Delete('images/:id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async deleteImage(@Param('id') imageUrl: string) {
    try {
      console.log('🔄 Events Controller - Delete image request for:', imageUrl);
      await this.fileUploadService.deleteFile(decodeURIComponent(imageUrl));
      console.log('✅ Events Controller - Delete image successful');
      return { message: 'Image deleted successfully' };
    } catch (error: any) {
      console.error('❌ Events Controller - Delete image error:', error);
      throw error;
    }
  }
}
