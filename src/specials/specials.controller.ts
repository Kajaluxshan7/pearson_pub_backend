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
import { UpdateSpecialDto } from './dto/update-special.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('specials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialsController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5)) // Support up to 5 images
  async create(
    @Body() createSpecialDto: CreateSpecialDto,
    @Request() req,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    try {
      console.log('🔄 Specials Controller - Create request:', createSpecialDto);
      console.log(
        '🔄 Specials Controller - Images count:',
        images?.length || 0,
      );
      const result = await this.specialsService.create(
        createSpecialDto,
        req.user.id,
        images,
      );
      console.log('✅ Specials Controller - Create successful');
      return result;
    } catch (error: any) {
      console.error('❌ Specials Controller - Create error:', error);
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
    @Request() req,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    try {
      console.log('🔄 Specials Controller - Update request:', {
        id,
        updateSpecialDto,
      });
      console.log(
        '🔄 Specials Controller - Images count:',
        images?.length || 0,
      );

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
          console.log(
            '🔄 Specials Controller - Parsed removeImages:',
            removeImagesArray,
          );
        }
        if (existingImagesArray.length > 0) {
          (processedDto as any).existingImages = existingImagesArray;
          console.log(
            '🔄 Specials Controller - Parsed existingImages:',
            existingImagesArray,
          );
        }
      }

      const result = await this.specialsService.update(
        id,
        processedDto,
        req.user.id,
        images,
      );
      console.log('✅ Specials Controller - Update successful');
      return result;
    } catch (error: any) {
      console.error('❌ Specials Controller - Update error:', error);
      throw error;
    }
  }

  @Post('upload-image')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    try {
      console.log('🔄 Specials Controller - Image upload request');
      const imageUrl = await this.specialsService.uploadImage(image);
      console.log('✅ Specials Controller - Image upload successful');
      return { imageUrl };
    } catch (error: any) {
      console.error('❌ Specials Controller - Image upload error:', error);
      throw error;
    }
  }

  @Post('upload-images')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(@UploadedFiles() images: Express.Multer.File[]) {
    try {
      console.log('🔄 Specials Controller - Multiple images upload request');
      const imageUrls = await this.specialsService.uploadImages(images);
      console.log('✅ Specials Controller - Multiple images upload successful');
      return { imageUrls };
    } catch (error: any) {
      console.error(
        '❌ Specials Controller - Multiple images upload error:',
        error,
      );
      throw error;
    }
  }

  @Delete('images/:id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async deleteImage(@Param('id') imageUrl: string) {
    try {
      console.log(
        '🔄 Specials Controller - Delete image request for:',
        imageUrl,
      );
      await this.specialsService.deleteFile(decodeURIComponent(imageUrl));
      console.log('✅ Specials Controller - Delete image successful');
      return { message: 'Image deleted successfully' };
    } catch (error: any) {
      console.error('❌ Specials Controller - Delete image error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      console.log('🔄 Specials Controller - Delete request for ID:', id);
      await this.specialsService.remove(id);
      console.log('✅ Specials Controller - Delete successful');
      return { message: 'Special deleted successfully' };
    } catch (error: any) {
      console.error('❌ Specials Controller - Delete error:', error);
      throw error;
    }
  }
}
