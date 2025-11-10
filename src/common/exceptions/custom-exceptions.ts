import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        errorType: 'BusinessException',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;

    super(
      {
        message,
        errorType: 'ResourceNotFoundException',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string, errors?: any) {
    super(
      {
        message,
        errors,
        errorType: 'ValidationException',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super(
      {
        message,
        errorType: 'UnauthorizedException',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Access forbidden') {
    super(
      {
        message,
        errorType: 'ForbiddenException',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        errorType: 'ConflictException',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, details?: any) {
    super(
      {
        message: `External service '${service}' is unavailable`,
        details,
        errorType: 'ExternalServiceException',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class DatabaseException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        errorType: 'DatabaseException',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
