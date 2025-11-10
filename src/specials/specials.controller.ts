import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { SpecialsService } from './specials.service';
import { CreateSpecialDto } from './dto/create-special.dto';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { UpdateSpecialDto } from './dto/update-special.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';
import { LoggerService } from '../common/logger/logger.service';

@Controller('specials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialsController {
  private readonly logger = new LoggerService(SpecialsController.name);

  constructor(private readonly specialsService: SpecialsService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5)) // Support up to 5 images
  async create(
    @Body() createSpecialDto: CreateSpecialDto,
    @Request() req: AuthenticatedRequest,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    try {
      this.logger.log(`🔄 Create request: ${JSON.stringify(createSpecialDto)}`);
      this.logger.log(`🔄 Images count: ${images?.length || 0}`);
      const result = await this.specialsService.create(
        createSpecialDto,
        req.user.id,
        images,
      );
      this.logger.log('✅ Create successful');
      return result;
    } catch (error: any) {
      this.logger.error('❌ Create error:', error?.message || error);
      throw error;
    }
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('specialType') specialType?: string,
  ) {
    return this.specialsService.findAll(page, limit, search, specialType);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5)) // Support up to 5 images
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialDto: UpdateSpecialDto,
    @Request() req: AuthenticatedRequest,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    try {
      this.logger.log(
        `🔄 Update request: ${JSON.stringify({ id, updateSpecialDto })}`,
      );
      this.logger.log(`🔄 Images count: ${images?.length || 0}`);

      // Parse removeImages and existingImages arrays from FormData if they exist
      const processedDto = { ...updateSpecialDto };
      if (updateSpecialDto && typeof updateSpecialDto === 'object') {
        const removeImagesArray: string[] = [];
        const existingImagesArray: string[] = [];

        // Check for removeImages and existingImages array format from FormData
        Object.keys(updateSpecialDto).forEach((key) => {
          if (key.startsWith('removeImages[')) {
            const value = (updateSpecialDto as any)[key];
            if (value) {
              removeImagesArray.push(value);
            }
            // Remove the individual array element from DTO
            delete (processedDto as any)[key];
          } else if (key.startsWith('existingImages[')) {
            const value = (updateSpecialDto as any)[key];
            if (value) {
              existingImagesArray.push(value);
            }
            // Remove the individual array element from DTO
            delete (processedDto as any)[key];
          }
        });

        // Add the parsed arrays to the DTO
        if (removeImagesArray.length > 0) {
          (processedDto as any).removeImages = removeImagesArray;
          this.logger.log(
            `🔄 Parsed removeImages: ${JSON.stringify(removeImagesArray)}`,
          );
        }
        if (existingImagesArray.length > 0) {
          (processedDto as any).existingImages = existingImagesArray;
          this.logger.log(
            `🔄 Parsed existingImages: ${JSON.stringify(existingImagesArray)}`,
          );
        }
      }

      const result = await this.specialsService.update(
        id,
        processedDto,
        req.user.id,
        images,
      );
      this.logger.log('✅ Update successful');
      return result;
    } catch (error: any) {
      this.logger.error('❌ Update error:', error?.message || error);
      throw error;
    }
  }

  @Post('upload-image')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    try {
      this.logger.log('🔄 Image upload request');
      const imageUrl = await this.specialsService.uploadImage(image);
      this.logger.log('✅ Image upload successful');
      return { imageUrl };
    } catch (error: any) {
      this.logger.error('❌ Image upload error:', error?.message || error);
      throw error;
    }
  }

  @Post('upload-images')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(@UploadedFiles() images: Express.Multer.File[]) {
    try {
      this.logger.log('🔄 Multiple images upload request');
      const imageUrls = await this.specialsService.uploadImages(images);
      this.logger.log('✅ Multiple images upload successful');
      return { imageUrls };
    } catch (error: any) {
      this.logger.error(
        '❌ Multiple images upload error:',
        error?.message || error,
      );
      throw error;
    }
  }

  @Delete('images/:id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async deleteImage(@Param('id') imageUrl: string) {
    try {
      this.logger.log(`🔄 Delete image request for: ${imageUrl}`);
      await this.specialsService.deleteFile(decodeURIComponent(imageUrl));
      this.logger.log('✅ Delete image successful');
      return { message: 'Image deleted successfully' };
    } catch (error: any) {
      this.logger.error('❌ Delete image error:', error?.message || error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(`🔄 Delete request for ID: ${id}`);
      await this.specialsService.remove(id);
      this.logger.log('✅ Delete successful');
      return { message: 'Special deleted successfully' };
    } catch (error: any) {
      this.logger.error('❌ Delete error:', error?.message || error);
      throw error;
    }
  }
}
