import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story } from './entities/story.entity';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Story])],
  controllers: [StoriesController],
  providers: [StoriesService, FileUploadService],
  exports: [StoriesService],
})
export class StoriesModule {}
