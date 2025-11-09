import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Special } from './entities/special.entity';
import { CreateSpecialDto } from './dto/create-special.dto';
import { UpdateSpecialDto } from './dto/update-special.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { TimezoneService } from '../common/services/timezone.service';

@Injectable()
export class SpecialsService {
  constructor(
    @InjectRepository(Special)
    private specialsRepository: Repository<Special>,
    private fileUploadService: FileUploadService,
    private timezoneService: TimezoneService,
  ) {}

  async create(
    createSpecialDto: CreateSpecialDto,
    adminId?: string,
    images?: Express.Multer.File[],
  ): Promise<Special> {
    // Validate business rules
    this.validateSpecialRules(createSpecialDto);

    // Convert Toronto timezone to UTC for seasonal specials
    let startDateUtc: Date | undefined;
    let endDateUtc: Date | undefined;
    let displayStartTimeUtc: Date | undefined;
    let displayEndTimeUtc: Date | undefined;

    if (createSpecialDto.special_type === 'seasonal') {
      if (createSpecialDto.seasonal_start_datetime) {
        startDateUtc = this.timezoneService.parseEventDateTime(
          createSpecialDto.seasonal_start_datetime.toString(),
        );
      }
      if (createSpecialDto.seasonal_end_datetime) {
        endDateUtc = this.timezoneService.parseEventDateTime(
          createSpecialDto.seasonal_end_datetime.toString(),
        );
      }
    }

    // Convert display times to UTC
    if (createSpecialDto.display_start_time) {
      displayStartTimeUtc = this.timezoneService.parseEventDateTime(
        createSpecialDto.display_start_time.toString(),
      );
    }
    if (createSpecialDto.display_end_time) {
      displayEndTimeUtc = this.timezoneService.parseEventDateTime(
        createSpecialDto.display_end_time.toString(),
      );
    }

    const imageUrls: string[] = [];
    let primaryImageUrl: string | undefined;

    if (images && images.length > 0) {
      // Limit to maximum 5 images
      const limitedImages = images.slice(0, 5);

      // Upload each image
      for (const image of limitedImages) {
        const uploadResult = await this.fileUploadService.uploadFile(
          image,
          'specials',
        );
        imageUrls.push(uploadResult.url);
      }

      // Set the first image as the primary image for backward compatibility
      primaryImageUrl = imageUrls[0];
    }

    const special = this.specialsRepository.create({
      ...createSpecialDto,
      seasonal_start_datetime: startDateUtc,
      seasonal_end_datetime: endDateUtc,
      display_start_time: displayStartTimeUtc,
      display_end_time: displayEndTimeUtc,
      image_url: primaryImageUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      lastEditedByAdminId: adminId,
    });
    return await this.specialsRepository.save(special);
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const uploadResult = await this.fileUploadService.uploadFile(
      file,
      'specials',
    );
    return uploadResult.url;
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const limitedFiles = files.slice(0, 5); // Limit to 5 images
    const imageUrls: string[] = [];

    for (const file of limitedFiles) {
      const uploadResult = await this.fileUploadService.uploadFile(
        file,
        'specials',
      );
      imageUrls.push(uploadResult.url);
    }

    return imageUrls;
  }

  async deleteFile(imageUrl: string): Promise<void> {
    await this.fileUploadService.deleteFile(imageUrl);
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    specialType?: string,
  ): Promise<{ data: Special[]; total: number }> {
    const query = this.specialsRepository
      .createQueryBuilder('special')
      .leftJoinAndSelect('special.specialsDay', 'specialsDay')
      .leftJoinAndSelect('special.lastEditedByAdmin', 'admin');

    if (search) {
      query.where(
        'LOWER(special.season_name) LIKE LOWER(:search) OR LOWER(special.description) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (specialType) {
      query.andWhere('special.special_type = :specialType', { specialType });
    }

    query.orderBy('special.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findAllVisible(
    page = 1,
    limit = 10,
    search?: string,
    specialType?: string,
  ): Promise<{ data: Special[]; total: number }> {
    const now = new Date();
    const query = this.specialsRepository
      .createQueryBuilder('special')
      .leftJoinAndSelect('special.specialsDay', 'specialsDay')
      .leftJoinAndSelect('special.lastEditedByAdmin', 'admin');

    if (search) {
      query.where(
        'LOWER(special.season_name) LIKE LOWER(:search) OR LOWER(special.description) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (specialType) {
      query.andWhere('special.special_type = :specialType', { specialType });
    }

    // Filter by display times - only show specials within their display window
    query.andWhere(
      '(special.display_start_time IS NULL OR special.display_start_time <= :now)',
      { now },
    );
    query.andWhere(
      '(special.display_end_time IS NULL OR special.display_end_time >= :now)',
      { now },
    );

    query.orderBy('special.created_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Special> {
    const special = await this.specialsRepository.findOne({
      where: { id },
      relations: ['specialsDay', 'lastEditedByAdmin'],
    });

    if (!special) {
      throw new NotFoundException(`Special with ID ${id} not found`);
    }

    return special;
  }

  async update(
    id: string,
    updateSpecialDto: UpdateSpecialDto,
    adminId?: string,
    images?: Express.Multer.File[],
  ): Promise<Special> {
    const existingSpecial = await this.findOne(id); // Check if exists

    // Validate business rules
    this.validateSpecialRules(updateSpecialDto);

    // Convert Toronto timezone to UTC for seasonal specials if datetime fields are being updated
    if (updateSpecialDto.seasonal_start_datetime) {
      (updateSpecialDto as any).seasonal_start_datetime =
        this.timezoneService.parseEventDateTime(
          updateSpecialDto.seasonal_start_datetime.toString(),
        );
    }

    if (updateSpecialDto.seasonal_end_datetime) {
      (updateSpecialDto as any).seasonal_end_datetime =
        this.timezoneService.parseEventDateTime(
          updateSpecialDto.seasonal_end_datetime.toString(),
        );
    }

    // Convert display times to UTC
    if (updateSpecialDto.display_start_time) {
      (updateSpecialDto as any).display_start_time =
        this.timezoneService.parseEventDateTime(
          updateSpecialDto.display_start_time.toString(),
        );
    }

    if (updateSpecialDto.display_end_time) {
      (updateSpecialDto as any).display_end_time =
        this.timezoneService.parseEventDateTime(
          updateSpecialDto.display_end_time.toString(),
        );
    }

    const newImageUrls: string[] = [];
    let newPrimaryImageUrl: string | undefined;
    let shouldDeleteOldImages = false;
    const shouldRemoveImagesFromDb = false;

    // Handle image update logic
    if (images && images.length > 0) {
      // New images uploaded, upload them first
      const limitedImages = images.slice(0, 5); // Limit to 5 images

      for (const image of limitedImages) {
        const uploadResult = await this.fileUploadService.uploadFile(
          image,
          'specials',
        );
        newImageUrls.push(uploadResult.url);
      }

      newPrimaryImageUrl = newImageUrls[0]; // First image as primary
      shouldDeleteOldImages = true; // Will delete old images after successful update
    }

    // Check if specific images are being removed (when frontend sends removeImages array)
    const imagesToRemove = (updateSpecialDto as any).removeImages || [];
    const existingImagesToKeep = (updateSpecialDto as any).existingImages || [];
    const hasImagesToRemove =
      Array.isArray(imagesToRemove) && imagesToRemove.length > 0;
    const hasExistingImagesToKeep =
      Array.isArray(existingImagesToKeep) && existingImagesToKeep.length > 0;

    console.log('🔄 SpecialsService - Images to remove:', imagesToRemove);
    console.log(
      '🔄 SpecialsService - Existing images to keep:',
      existingImagesToKeep,
    );

    if (hasImagesToRemove) {
      shouldDeleteOldImages = true;
      console.log('✅ SpecialsService - Individual images marked for removal');
    }

    // Prepare update data
    const updateData: any = {
      ...updateSpecialDto,
      ...(adminId && { lastEditedByAdminId: adminId }),
    };

    // Handle image URL updates
    if (images && images.length > 0) {
      // Combining new images with existing images that should be kept
      if (hasExistingImagesToKeep) {
        // Combine existing images to keep with new uploaded images
        const combinedImageUrls = [...existingImagesToKeep, ...newImageUrls];
        const limitedCombinedImages = combinedImageUrls.slice(0, 5); // Ensure max 5 images

        updateData.image_urls = limitedCombinedImages;
        // Set primary image - prefer first existing image if available, otherwise first new image
        updateData.image_url =
          existingImagesToKeep.length > 0
            ? existingImagesToKeep[0]
            : newImageUrls[0];

        console.log(
          '🔄 SpecialsService - Combined images (existing + new):',
          limitedCombinedImages,
        );
      } else {
        // No existing images to keep, use only new images
        updateData.image_url = newPrimaryImageUrl;
        updateData.image_urls = newImageUrls;
        console.log(
          '🔄 SpecialsService - Using only new images:',
          newImageUrls,
        );
      }
    } else if (hasImagesToRemove || hasExistingImagesToKeep) {
      // No new images uploaded, but handling existing image changes
      if (hasExistingImagesToKeep) {
        // Use only the existing images that should be kept
        updateData.image_urls =
          existingImagesToKeep.length > 0 ? existingImagesToKeep : null;
        updateData.image_url =
          existingImagesToKeep.length > 0 ? existingImagesToKeep[0] : null;
        console.log(
          '🔄 SpecialsService - Using only existing images to keep:',
          existingImagesToKeep,
        );
      } else {
        // Handle individual image removal (legacy logic for backward compatibility)
        const currentImageUrls = existingSpecial.image_urls || [];
        const currentImageUrl = existingSpecial.image_url;

        // Filter out removed images from image_urls array
        const remainingImageUrls = currentImageUrls.filter(
          (url) => !imagesToRemove.includes(url),
        );

        // Handle legacy image_url field
        let newImageUrl: string | null = currentImageUrl;
        if (imagesToRemove.includes(currentImageUrl)) {
          newImageUrl = null;
        }

        // Update database fields
        updateData.image_url = newImageUrl;
        updateData.image_urls =
          remainingImageUrls.length > 0 ? remainingImageUrls : null;
        console.log(
          '🔄 SpecialsService - Legacy removal logic - remaining images:',
          remainingImageUrls,
        );
      }
    }

    // Remove the custom arrays from update data as they're not database fields
    delete updateData.removeImages;
    delete updateData.existingImages;

    console.log(
      '🔄 SpecialsService - Update data before database save:',
      updateData,
    );

    // Update the database
    const updateResult = await this.specialsRepository.update(id, updateData);
    console.log('✅ SpecialsService - Database update result:', updateResult);

    // Delete old images from S3 if needed (after successful database update)
    if (hasImagesToRemove && imagesToRemove.length > 0) {
      // Delete only specific images marked for removal
      for (const imageUrl of imagesToRemove) {
        try {
          await this.fileUploadService.deleteFile(imageUrl);
          console.log('✅ Specific image deleted from S3:', imageUrl);
        } catch (error: any) {
          console.error('❌ Failed to delete specific image from S3:', error);
        }
      }
    } else if (images && images.length > 0 && !hasExistingImagesToKeep) {
      // Only delete all old images if we're replacing them completely (no existing images to keep)
      if (existingSpecial.image_url) {
        try {
          await this.fileUploadService.deleteFile(existingSpecial.image_url);
          console.log(
            '✅ Old special image deleted from S3 (complete replacement):',
            existingSpecial.image_url,
          );
        } catch (error: any) {
          console.error(
            '❌ Failed to delete old special image from S3:',
            error,
          );
        }
      }

      if (existingSpecial.image_urls && existingSpecial.image_urls.length > 0) {
        for (const imageUrl of existingSpecial.image_urls) {
          try {
            await this.fileUploadService.deleteFile(imageUrl);
            console.log(
              '✅ Old special image deleted from S3 (complete replacement):',
              imageUrl,
            );
          } catch (error: any) {
            console.error(
              '❌ Failed to delete old special image from S3:',
              error,
            );
          }
        }
      }
    }

    // Fetch and return the updated special
    const updatedSpecial = await this.findOne(id);
    console.log('🔍 SpecialsService - Final special after update:', {
      id: updatedSpecial.id,
      image_url: updatedSpecial.image_url,
      image_urls: updatedSpecial.image_urls,
      description: updatedSpecial.description,
    });

    return updatedSpecial;
  }

  async remove(id: string): Promise<void> {
    const special = await this.findOne(id);

    // Delete associated image from S3 if exists (legacy single image)
    if (special.image_url) {
      try {
        await this.fileUploadService.deleteFile(special.image_url);
        console.log('✅ Special image deleted from S3:', special.image_url);
      } catch (error: any) {
        console.error('❌ Failed to delete special image from S3:', error);
        // Continue with special deletion even if S3 deletion fails
      }
    }

    // Delete associated images from S3 if exist (new multiple images)
    if (special.image_urls && special.image_urls.length > 0) {
      for (const imageUrl of special.image_urls) {
        try {
          await this.fileUploadService.deleteFile(imageUrl);
          console.log('✅ Special image deleted from S3:', imageUrl);
        } catch (error: any) {
          console.error('❌ Failed to delete special image from S3:', error);
          // Continue with special deletion even if S3 deletion fails
        }
      }
    }

    await this.specialsRepository.remove(special);
  }

  private validateSpecialRules(dto: CreateSpecialDto | UpdateSpecialDto): void {
    // Rule 1: If special_type = 'daily', then specials_day_id is required and seasonal fields should be null
    if (dto.special_type === 'daily') {
      if (!dto.specialsDayId) {
        throw new BadRequestException(
          'specialsDayId is required for daily specials',
        );
      }
      if (
        dto.seasonal_start_datetime ||
        dto.seasonal_end_datetime ||
        dto.season_name
      ) {
        throw new BadRequestException(
          'Seasonal fields should not be set for daily specials',
        );
      }
    }

    // Rule 2: If special_type = 'seasonal', then season_name and both start/end datetimes are required
    if (dto.special_type === 'seasonal') {
      if (dto.specialsDayId) {
        throw new BadRequestException(
          'specialsDayId should not be set for seasonal specials',
        );
      }
      if (!dto.season_name) {
        throw new BadRequestException(
          'season_name is required for seasonal specials',
        );
      }
      if (!dto.seasonal_start_datetime || !dto.seasonal_end_datetime) {
        throw new BadRequestException(
          'Both seasonal_start_datetime and seasonal_end_datetime are required for seasonal specials',
        );
      }
      // Validate that start datetime is before end datetime
      if (
        new Date(dto.seasonal_start_datetime) >=
        new Date(dto.seasonal_end_datetime)
      ) {
        throw new BadRequestException(
          'seasonal_start_datetime must be before seasonal_end_datetime',
        );
      }
    }

    // Rule 3: If special_type = 'latenight', no other fields required except description and image
    if (dto.special_type === 'latenight') {
      if (dto.specialsDayId) {
        throw new BadRequestException(
          'specialsDayId should not be set for latenight specials',
        );
      }
      if (
        dto.seasonal_start_datetime ||
        dto.seasonal_end_datetime ||
        dto.season_name
      ) {
        throw new BadRequestException(
          'Seasonal fields should not be set for latenight specials',
        );
      }
    }
  }
}
