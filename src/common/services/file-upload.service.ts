import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class FileUploadService {
  private readonly logger = new LoggerService(FileUploadService.name);
  private s3Client!: S3Client;
  private bucketName: string;
  private useAWS: boolean;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'pearson-pub-images';
    this.useAWS = !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );

    if (this.useAWS) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'items',
  ): Promise<{ url: string; signedUrl?: string }> {
    // Validate file size (1MB max)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
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

    if (!this.useAWS) {
      // For development without AWS credentials, create a base64 data URL for local use
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

      this.logger.log(
        `📸 Local upload: ${file.originalname} (${file.size} bytes) - converted to base64 data URL`,
      );

      return {
        url: dataUrl,
        signedUrl: dataUrl,
      };
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Remove ACL for better security - use pre-signed URLs instead
    });

    try {
      await this.s3Client.send(command);
      const url = `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;

      // Generate pre-signed URL for secure access
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 3600, // 1 hour
      });

      return { url, signedUrl };
    } catch (error: any) {
      this.logger.error('Error uploading file to S3:', error?.message || error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'items',
  ): Promise<{ url: string; signedUrl?: string }[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.useAWS) {
      // For development without AWS credentials, just log the deletion
      // Check if it's a data URL (base64 image)
      if (fileUrl.startsWith('data:')) {
        this.logger.log(
          `🗑️ Local delete: base64 data URL (${fileUrl.substring(0, 50)}...)`,
        );
      } else {
        this.logger.log(`🗑️ Mock delete: ${fileUrl}`);
      }
      return;
    }

    // Extract the key from the S3 URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      this.logger.error(
        'Error deleting file from S3:',
        error?.message || error,
      );
      throw new Error('Failed to delete file');
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  async getSignedUrl(fileUrl: string): Promise<string> {
    if (!this.useAWS) {
      // For development, if it's already a data URL, return as-is
      if (fileUrl.startsWith('data:')) {
        return fileUrl;
      }
      // Otherwise return the original URL with a mock query parameter
      return `${fileUrl}?presigned=true&expires=${Date.now() + 3600000}`;
    }

    try {
      // Extract the key from the S3 URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
      });
    } catch (error: any) {
      this.logger.error(
        'Error generating signed URL:',
        error?.message || error,
      );
      throw new Error('Failed to generate signed URL');
    }
  }

  async getMultipleSignedUrls(fileUrls: string[]): Promise<string[]> {
    const signedUrlPromises = fileUrls.map((url) => this.getSignedUrl(url));
    return Promise.all(signedUrlPromises);
  }
}
