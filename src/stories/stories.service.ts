import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private storiesRepository: Repository<Story>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(
    createStoryDto: CreateStoryDto,
    adminId: string,
    images?: Express.Multer.File[],
  ): Promise<Story> {
    // Validate maximum 5 images
    if (images && images.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed per story');
    }

    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      // Validate each image is max 1MB (already handled in FileUploadService)
      const uploadResults = await this.fileUploadService.uploadMultipleFiles(
        images,
        'stories',
      );
      imageUrls = uploadResults.map((result) => result.url);
    }

    const story = this.storiesRepository.create({
      ...createStoryDto,
      images: imageUrls,
      lastEditedByAdminId: adminId,
    });
    return this.storiesRepository.save(story);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: Story[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.storiesRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.lastEditedByAdmin', 'admin');

    if (search) {
      queryBuilder.where(
        'story.story_name ILIKE :search OR story.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    queryBuilder
      .orderBy('story.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Story> {
    const story = await this.storiesRepository.findOne({
      where: { id },
      relations: ['lastEditedByAdmin'],
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return story;
  }

  async update(
    id: string,
    updateStoryDto: UpdateStoryDto,
    adminId: string,
    newImages?: Express.Multer.File[],
  ): Promise<Story> {
    const story = await this.findOne(id);

    console.log('🔄 StoriesService - Current story images:', story.images);
    console.log('🔄 StoriesService - Update DTO:', updateStoryDto);
    console.log(
      '🔄 StoriesService - New images count:',
      newImages?.length || 0,
    );

    // Check if specific images are being removed (when frontend sends removeImages array)
    const imagesToRemove = updateStoryDto.removeImages || [];
    const existingImagesToKeep = updateStoryDto.existingImages || [];
    const hasImagesToRemove =
      Array.isArray(imagesToRemove) && imagesToRemove.length > 0;
    const hasExistingImagesToKeep =
      Array.isArray(existingImagesToKeep) && existingImagesToKeep.length > 0;

    console.log('🔄 StoriesService - Images to remove:', imagesToRemove);
    console.log(
      '🔄 StoriesService - Existing images to keep:',
      existingImagesToKeep,
    );

    let newImageUrls: string[] = [];
    let finalImages: string[] = [];

    // Upload new images first if provided
    if (newImages && newImages.length > 0) {
      console.log('🔄 StoriesService - Uploading new images...');
      const limitedImages = newImages.slice(0, 5); // Limit to 5 images

      const uploadResults = await this.fileUploadService.uploadMultipleFiles(
        limitedImages,
        'stories',
      );
      newImageUrls = uploadResults.map((result) => result.url);
      console.log('✅ StoriesService - New images uploaded:', newImageUrls);
    }

    // Handle image URL updates based on different scenarios
    if (hasExistingImagesToKeep || hasImagesToRemove) {
      // Explicit image management provided - respect the frontend's instructions
      if (hasExistingImagesToKeep) {
        // Use the explicitly provided list of images to keep
        finalImages = [...existingImagesToKeep];
        console.log(
          '🔄 StoriesService - Using explicitly provided existing images to keep:',
          finalImages,
        );
      } else {
        // Only removeImages provided, keep all current images except those marked for removal
        const currentImages = story.images || [];
        finalImages = currentImages.filter(
          (url) => !imagesToRemove.includes(url),
        );
        console.log(
          '🔄 StoriesService - Removing specific images, keeping rest:',
          finalImages,
        );
      }

      // Add new images to the final list
      if (newImages && newImages.length > 0) {
        finalImages = [...finalImages, ...newImageUrls];
        console.log(
          '🔄 StoriesService - Added new images to existing ones:',
          finalImages,
        );
      }
    } else {
      // No explicit image management provided
      if (newImages && newImages.length > 0) {
        // New images uploaded but no existing image management - ADD to current images (don't replace)
        const currentImages = story.images || [];
        finalImages = [...currentImages, ...newImageUrls];
        console.log(
          '🔄 StoriesService - Adding new images to current images (preserving existing):',
          finalImages,
        );
      } else {
        // No changes to images, keep current images
        finalImages = story.images || [];
        console.log(
          '🔄 StoriesService - No image changes, keeping current images:',
          finalImages,
        );
      }
    }

    // Validate maximum 5 images total
    if (finalImages.length > 5) {
      // Clean up newly uploaded images if validation fails
      if (newImageUrls.length > 0) {
        try {
          await this.fileUploadService.deleteMultipleFiles(newImageUrls);
        } catch (error) {
          console.error('Error cleaning up uploaded images:', error);
        }
      }
      throw new BadRequestException(
        `Maximum 5 images allowed per story. Final count would be: ${finalImages.length}`,
      );
    }

    // Prepare update data
    const { removeImages, existingImages, ...updateData } = updateStoryDto;

    // Update the story in database
    Object.assign(story, updateData);
    story.images = finalImages;
    story.lastEditedByAdminId = adminId;

    console.log('🔄 StoriesService - Final images for story:', finalImages);
    const savedStory = await this.storiesRepository.save(story);
    console.log('✅ StoriesService - Story saved to database');

    // Delete old images from S3 if needed (after successful database update)
    // ONLY delete images that are explicitly marked for removal
    if (hasImagesToRemove && imagesToRemove.length > 0) {
      console.log(
        '🔄 StoriesService - Deleting specific images marked for removal from S3:',
        imagesToRemove,
      );
      for (const imageUrl of imagesToRemove) {
        try {
          await this.fileUploadService.deleteFile(imageUrl);
          console.log('✅ Specific image deleted from S3:', imageUrl);
        } catch (error) {
          console.error('❌ Failed to delete specific image from S3:', error);
        }
      }
    } else {
      console.log(
        '🔄 StoriesService - No images marked for removal, preserving all existing images',
      );
    }

    console.log('🔍 StoriesService - Final story after update:', {
      id: savedStory.id,
      images: savedStory.images,
      story_name: savedStory.story_name,
    });

    return savedStory;
  }

  async remove(id: string): Promise<void> {
    const story = await this.findOne(id);

    // Delete associated images from S3
    if (story.images && story.images.length > 0) {
      try {
        await this.fileUploadService.deleteMultipleFiles(story.images);
      } catch (error) {
        console.error('Error deleting story images from S3:', error);
        // Don't fail the deletion if S3 deletion fails
      }
    }

    await this.storiesRepository.remove(story);
  }

  async uploadImages(
    storyId: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const story = await this.findOne(storyId);

    // Validate maximum 5 images total
    const currentImageCount = story.images?.length || 0;
    if (currentImageCount + files.length > 5) {
      throw new BadRequestException(
        `Maximum 5 images allowed per story. Current: ${currentImageCount}, Trying to add: ${files.length}`,
      );
    }

    const uploadResults = await this.fileUploadService.uploadMultipleFiles(
      files,
      'stories',
    );
    const newImageUrls = uploadResults.map((result) => result.url);

    // Update story with new images
    story.images = [...(story.images || []), ...newImageUrls];
    await this.storiesRepository.save(story);

    return newImageUrls;
  }

  async removeImage(storyId: string, imageUrl: string): Promise<void> {
    const story = await this.findOne(storyId);

    if (!story.images || !story.images.includes(imageUrl)) {
      throw new NotFoundException('Image not found in this story');
    }

    // Remove image from S3
    try {
      await this.fileUploadService.deleteFile(imageUrl);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      // Continue with removal from database even if S3 deletion fails
    }

    // Remove image URL from story
    story.images = story.images.filter((url) => url !== imageUrl);
    await this.storiesRepository.save(story);
  }
}
