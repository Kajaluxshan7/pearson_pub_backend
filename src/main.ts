import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/logger/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Create logger instance for bootstrap errors
const bootstrapLogger = new LoggerService('Bootstrap');

// Global error handler
process.on('uncaughtException', (error) => {
  bootstrapLogger.error('UNCAUGHT EXCEPTION', error.stack || '', 'Process');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  bootstrapLogger.error(
    `UNHANDLED REJECTION: ${reason}`,
    JSON.stringify(promise),
    'Process',
  );
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Initialize logger
  const logger = new LoggerService('Application');
  app.useLogger(logger);

  // Get port from environment variable directly
  const port = process.env.PORT || 5000;
  logger.log(`Starting application on port: ${port}`, 'Bootstrap');

  // Validate JWT_SECRET is not default value
  const jwtSecret = process.env.JWT_SECRET;
  if (
    !jwtSecret ||
    jwtSecret.includes('CHANGE_THIS') ||
    jwtSecret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be set to a secure value (minimum 32 characters) and changed from the default placeholder.',
    );
  }

  // Configure custom body parser with increased size limits
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

  // Enable CORS with environment-based origins
  const corsOrigins = process.env.CORS_ORIGINS;
  if (!corsOrigins) {
    throw new Error(
      'CORS_ORIGINS is required. Please set it in your environment variables.',
    );
  }

  app.enableCors({
    origin: corsOrigins.split(',').map((origin: string) => origin.trim()),
    credentials: true,
  });

  logger.log('CORS enabled for origins: ' + corsOrigins, 'Bootstrap');

  // Enable cookie parser
  app.use(cookieParser());

  // Enable validation pipes with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Add global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Add global exception filter with logger
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Setup Swagger API Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('The Pearson Pub API')
      .setDescription(
        'Backend API for The Pearson Pub Restaurant Management System',
      )
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('menu', 'Menu management')
      .addTag('events', 'Events management')
      .addTag('specials', 'Daily specials')
      .addTag('stories', 'Stories management')
      .addTag('operation-hours', 'Restaurant operation hours')
      .addTag('public-api', 'Public facing APIs')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(
      'Swagger documentation available at: http://0.0.0.0:' +
        port +
        '/api-docs',
      'Bootstrap',
    );
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
}
void bootstrap();
