import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger?: LoggerService) {
    if (!logger) {
      this.logger = new LoggerService('GlobalExceptionFilter');
    }
  }

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
    const errorContext = `HTTP ${status} Error: ${message}\nMethod: ${request.method}\nURL: ${request.url}\nBody: ${JSON.stringify(request.body)}\nParams: ${JSON.stringify(request.params)}\nQuery: ${JSON.stringify(request.query)}`;
    this.logger!.error(
      errorContext,
      exception instanceof Error ? exception.stack : '',
      'GlobalExceptionFilter',
    );

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
