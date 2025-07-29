import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('stories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
  create(
    @Body() createStoryDto: CreateStoryDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req,
  ) {
    // Validate image files
    if (images && images.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed per story');
    }

    return this.storiesService.create(createStoryDto, req.user.sub, images);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.storiesService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req,
  ) {
    console.log('Raw body received:', req.body);
    console.log('Uploaded files:', images?.length || 0);

    // Parse arrays from FormData if they exist
    let removeImagesArray: string[] = [];
    let existingImagesArray: string[] = [];

    // Handle removeImages array from FormData (both with and without brackets)
    if (req.body['removeImages[]']) {
      removeImagesArray = Array.isArray(req.body['removeImages[]'])
        ? req.body['removeImages[]']
        : [req.body['removeImages[]']];
      delete req.body['removeImages[]']; // Clean up FormData
      console.log('Parsed removeImages (with brackets):', removeImagesArray);
    } else if (req.body.removeImages) {
      removeImagesArray = Array.isArray(req.body.removeImages)
        ? req.body.removeImages
        : [req.body.removeImages];
      delete req.body.removeImages; // Clean up
      console.log('Parsed removeImages (without brackets):', removeImagesArray);
    }

    // Handle existingImages array from FormData (both with and without brackets)
    if (req.body['existingImages[]']) {
      existingImagesArray = Array.isArray(req.body['existingImages[]'])
        ? req.body['existingImages[]']
        : [req.body['existingImages[]']];
      delete req.body['existingImages[]']; // Clean up FormData
      console.log(
        'Parsed existingImages (with brackets):',
        existingImagesArray,
      );
    } else if (req.body.existingImages) {
      existingImagesArray = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      delete req.body.existingImages; // Clean up
      console.log(
        'Parsed existingImages (without brackets):',
        existingImagesArray,
      );
    }

    // Add parsed arrays to DTO
    const enhancedDto = {
      ...updateStoryDto,
      removeImages:
        removeImagesArray.length > 0 ? removeImagesArray : undefined,
      existingImages:
        existingImagesArray.length > 0 ? existingImagesArray : undefined,
    };

    console.log('Enhanced DTO:', enhancedDto);

    return this.storiesService.update(id, enhancedDto, req.user.sub, images);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storiesService.remove(id);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 5))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }
    return this.storiesService.uploadImages(id, files);
  }

  @Delete(':id/images')
  removeImage(@Param('id') id: string, @Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is required');
    }
    return this.storiesService.removeImage(id, imageUrl);
  }
}
