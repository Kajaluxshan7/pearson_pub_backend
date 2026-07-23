import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileUploadService } from '../services/file-upload.service';

@Injectable()
export class MediaUrlInterceptor implements NestInterceptor {
  constructor(private readonly fileUploadService: FileUploadService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.normalizeMediaUrls(data)));
  }

  private normalizeMediaUrls(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.fileUploadService.getPublicUrl(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeMediaUrls(item));
    }

    if (value instanceof Date || value === null || typeof value !== 'object') {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        this.normalizeMediaUrls(item),
      ]),
    );
  }
}
