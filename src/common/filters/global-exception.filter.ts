import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details || null;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;

      // Handle specific database errors
      const error = exception as any;

      if (error.code === '23505') {
        message = 'A record with this data already exists';
        details = 'Duplicate entry violation';
      } else if (error.code === '23503') {
        message =
          'Cannot delete this record as it is being referenced by other records';
        details = 'Foreign key constraint violation';
      } else if (error.code === '23502') {
        message = 'Required field is missing';
        details = 'Not null violation';
      } else {
        message = 'Database operation failed';
        details = error.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
    }

    // Log the error
    this.logger.error(`HTTP ${status} Error: ${message}`, {
      method: request.method,
      url: request.url,
      body: request.body,
      params: request.params,
      query: request.query,
      error: exception,
    });

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      details: process.env.NODE_ENV === 'development' ? details : null,
    });
  }
}
