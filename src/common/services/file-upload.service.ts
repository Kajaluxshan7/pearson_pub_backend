import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import 'multer';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class FileUploadService {
  private readonly logger = new LoggerService(FileUploadService.name);
  private readonly uploadDir: string;
  private readonly appUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.appUrl = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    const folders = ['items', 'stories', 'events', 'specials', 'profile'];
    for (const folder of folders) {
      const dir = path.join(this.uploadDir, folder);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created upload directory: ${dir}`);
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'items',
  ): Promise<{ url: string; signedUrl?: string }> {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must not exceed 5MB');
    }

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

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const folderPath = path.join(this.uploadDir, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const url = `${this.appUrl}/uploads/${folder}/${fileName}`;
    this.logger.log(`Saved file: ${filePath} → ${url}`);

    return { url, signedUrl: url };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'items',
  ): Promise<{ url: string; signedUrl?: string }[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl || fileUrl.startsWith('data:')) {
      return;
    }

    try {
      const urlPath = new URL(fileUrl).pathname; // /uploads/folder/file.ext
      const relativePath = urlPath.replace(/^\/uploads\//, '');
      const filePath = path.resolve(this.uploadDir, relativePath);

      // Guard against path traversal — resolved path must stay inside uploadDir
      if (!filePath.startsWith(path.resolve(this.uploadDir) + path.sep)) {
        this.logger.error(`Rejected suspicious delete path: ${filePath}`);
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      }
    } catch (error: any) {
      this.logger.error('Error deleting file:', error?.message || error);
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    await Promise.all(fileUrls.map((url) => this.deleteFile(url)));
  }

  async getSignedUrl(fileUrl: string): Promise<string> {
    // Local storage — no signing needed, return URL as-is
    return fileUrl;
  }

  async getMultipleSignedUrls(fileUrls: string[]): Promise<string[]> {
    return fileUrls;
  }
}
